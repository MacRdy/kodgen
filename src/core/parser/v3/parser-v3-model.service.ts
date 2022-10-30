import { OpenAPIV3 } from 'openapi-types';
import { toPascalCase } from '../../../core/utils';
import {
	ArrayReferenceModel,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	Reference,
	ReferenceModel,
} from '../../entities/model.model';
import { isValidPrimitiveType, SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './parser-v3.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(schema: OpenAPIV3.SchemaObject, name?: string, required?: boolean): ModelDef {
		let modelDef: ModelDef;

		if (!schema.type) {
			schema.type = 'string';
			// TODO INCORRECT SCHEMA {nullable: true}. FIX SCHEME AND DELETE IT
		}

		if (schema.type === 'object' && name) {
			const obj = new ObjectModelDef(name);

			modelDef = obj;
			this.repository.addEntity(modelDef, schema);

			const properties: Reference[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiV3ReferenceObject(propSchema)) {
					throw new Error('Unresolved schema reference.');
				}

				if (propSchema.type === 'array') {
					if (!propSchema.items) {
						throw new Error();
					}

					if (isOpenApiV3ReferenceObject(propSchema.items)) {
						throw new Error('Unresolved schema reference.');
					}

					const propDef = this.parseSchemaEntity(
						propSchema.items,
						toPascalCase(name, 'Items'),
					);

					const ref = new ArrayReferenceModel(
						propName,
						propDef,
						!!schema.required?.find(x => x === propName),
						!!propSchema.nullable,
					);

					properties.push(ref);
				} else {
					const propDef = this.parseSchemaEntity(
						propSchema,
						toPascalCase(name, propName),
					);

					const ref = new ReferenceModel(
						propName,
						propDef,
						!!schema.required?.find(x => x === propName),
						!!propSchema.nullable,
					);

					properties.push(ref);
				}
			}

			obj.setProperties(properties);
		} else if (isValidPrimitiveType(schema)) {
			modelDef = new PrimitiveModelDef(schema.type, schema.format);

			this.repository.addEntity(modelDef, schema); // TODO nado?
		} else {
			throw new Error('Unsupported model schema type.');
		}

		return modelDef;
	}
}
