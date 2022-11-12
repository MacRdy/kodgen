import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { mergeParts, unresolvedSchemaReferenceError } from '@core/utils';
import { OpenAPIV3 } from 'openapi-types';
import { ArrayModelDef } from '../../entities/schema-entities/array-model-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/model-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './v3-parser.model';

export class V3ParserModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(schema: OpenAPIV3.SchemaObject, name?: string): ModelDef {
		let modelDef: ModelDef;

		if (schema.type === 'object') {
			if (!name) {
				throw new Error('Object name not defined.');
			}

			const obj = new ObjectModelDef(
				name,
				undefined,
				schema.deprecated,
				schema.description,
				getExtensions(schema),
			);

			modelDef = obj;
			this.repository.addEntity(modelDef, schema);

			const properties: Property[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiV3ReferenceObject(propSchema)) {
					throw unresolvedSchemaReferenceError();
				}

				const propDef = this.parseSchemaEntity(propSchema, mergeParts(name, propName));

				const ref = new Property(
					propName,
					propDef,
					!!schema.required?.find(x => x === propName),
					propSchema.nullable,
					propSchema.readOnly,
					propSchema.writeOnly,
					propSchema.deprecated,
					propSchema.description,
				);

				properties.push(ref);
			}

			obj.setProperties(properties);
		} else if (schema.type === 'array') {
			if (isOpenApiV3ReferenceObject(schema.items)) {
				throw unresolvedSchemaReferenceError();
			}

			const entity = this.parseSchemaEntity(schema.items, `${name}Item`);

			modelDef = new ArrayModelDef(entity, getExtensions(schema));
		} else if (schema.type) {
			modelDef = new SimpleModelDef(schema.type, schema.format, getExtensions(schema));
		} else {
			throw new Error('Unsupported model schema type.');
		}

		return modelDef;
	}
}
