import { OpenAPIV3 } from 'openapi-types';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { TrivialError, UnresolvedReferenceError } from '../../../core/parser/parser.model';
import { mergeParts } from '../../../core/utils';
import { ArrayModelDef } from '../../entities/schema-entities/array-model-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, isOpenApiReferenceObject } from '../parser.model';
import { ParseSchemaEntityFn } from './v3-parser.model';

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

			const obj = new ObjectModelDef(name, {
				deprecated: schema.deprecated,
				description: schema.description,
				extensions: getExtensions(schema),
			});

			modelDef = obj;
			this.repository.addEntity(modelDef, schema);

			const properties: Property[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiReferenceObject(propSchema)) {
					throw new UnresolvedReferenceError();
				}

				const propDef = this.parseSchemaEntity(propSchema, mergeParts(name, propName));

				const prop = new Property(propName, propDef, {
					required: !!schema.required?.find(x => x === propName),
					nullable: propSchema.nullable,
					deprecated: propSchema.deprecated,
					readonly: propSchema.readOnly,
					writeonly: propSchema.writeOnly,
					description: propSchema.description,
					extensions: getExtensions(propSchema),
				});

				properties.push(prop);
			}

			obj.properties = properties;
		} else if (schema.type === 'array') {
			if (isOpenApiReferenceObject(schema.items)) {
				throw new UnresolvedReferenceError();
			}

			const entity = this.parseSchemaEntity(schema.items, `${name}Item`);

			modelDef = new ArrayModelDef(entity);
		} else if (schema.type) {
			modelDef = new SimpleModelDef(schema.type, { format: schema.format });
		} else {
			throw new TrivialError(
				`Unsupported model schema type (${schema.type ?? 'empty type'}).`,
			);
		}

		return modelDef;
	}
}
