import { OpenAPIV3 } from 'openapi-types';
import { SchemaEntity } from 'src/core/document.model';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceDef,
} from '../entities/model.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { generateName, isValidPrimitiveType } from '../parser.model';
import { isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './parser-v3.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(name: string, schema: OpenAPIV3.SchemaObject, required?: boolean): ModelDef {
		let modelDef: ModelDef;

		if (this.repository.hasSource(schema)) {
			modelDef = new ReferenceDef(name, this.repository.getEntity(schema).ref);
		} else if (schema.type === 'object') {
			const properties: ModelDef[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiV3ReferenceObject(propSchema)) {
					throw new Error('Unresolved schema reference.');
				}

				const propModelDef = this.parse(
					propName,
					propSchema,
					!!schema.required?.find(x => x === propName),
				);

				if (propModelDef instanceof ReferenceDef) {
					const modifiedModelDef = new ReferenceDef(propName, propModelDef.ref);
					properties.push(modifiedModelDef);
				} else {
					properties.push(propModelDef);
				}
			}

			modelDef = new ObjectModelDef(name, properties);
		} else if (schema.type === 'array') {
			const modelName = generateName([name, 'Item']);

			if (isOpenApiV3ReferenceObject(schema.items)) {
				throw new Error('Unresolved schema reference.');
			}

			const entity = this.parseSchemaEntity(modelName, schema.items);

			modelDef = new ArrayModelDef(name, entity.ref, !!required, !!schema.nullable);
		} else if (isValidPrimitiveType(schema)) {
			modelDef = new PrimitiveModelDef(
				name,
				schema.type,
				schema.format,
				!!required,
				!!schema.nullable,
			);
		} else {
			throw new Error('Unsupported model schema type.');
		}

		if (!isOpenApiV3ReferenceObject(schema)) {
			this.repository.addEntity(schema, modelDef);
		}

		return modelDef;
	}
}
