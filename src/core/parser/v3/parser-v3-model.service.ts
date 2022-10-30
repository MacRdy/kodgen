import { OpenAPIV3 } from 'openapi-types';
import { toPascalCase } from '../../../core/utils';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModel,
} from '../../entities/model.model';
import { SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
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

			const properties: ReferenceModel[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiV3ReferenceObject(propSchema)) {
					throw new Error('Unresolved schema reference.');
				}

				const propDef = this.parseSchemaEntity(propSchema, toPascalCase(name, propName));

				const ref = new ReferenceModel(
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
			modelDef = new PrimitiveModelDef(schema.type, schema.format);
		} else {
			throw new Error('Unsupported model schema type.');
		}

		return modelDef;
	}
}
