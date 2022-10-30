import { OpenAPIV3 } from 'openapi-types';
import { ArrayModelDef } from '../../../core/entities/array-model-def.model';
import { SimpleModelDef } from '../../../core/entities/simple-model-def.model';
import { toPascalCase } from '../../../core/utils';
import { ObjectModelDef } from '../../entities/model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { Property } from './../../entities/property.model';
import { isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './parser-v3.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(schema: OpenAPIV3.SchemaObject, name?: string): ModelDef {
		let modelDef: ModelDef;

		if (!schema.type) {
			schema.type = 'string';
			// TODO INCORRECT SCHEMA {nullable: true}. FIX SCHEME AND DELETE IT
		}

		if (name && schema.type === 'object') {
			const obj = new ObjectModelDef(name);

			modelDef = obj;
			this.repository.addEntity(modelDef, schema);

			const properties: Property[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiV3ReferenceObject(propSchema)) {
					throw new Error('Unresolved schema reference.');
				}

				const propDef = this.parseSchemaEntity(propSchema, toPascalCase(name, propName));

				const ref = new Property(
					propName,
					propDef,
					!!schema.required?.find(x => x === propName),
					!!propSchema.nullable,
				);

				properties.push(ref);
			}

			obj.setProperties(properties);
		} else if (schema.type === 'array') {
			if (isOpenApiV3ReferenceObject(schema.items)) {
				throw new Error('Unresolved schema reference.');
			}

			const entity = this.parseSchemaEntity(schema.items, `${name}Item`);

			modelDef = new ArrayModelDef(entity);
		} else if (schema.type) {
			modelDef = new SimpleModelDef(schema.type, schema.format);
		} else {
			throw new Error('Unsupported model schema type.');
		}

		return modelDef;
	}
}
