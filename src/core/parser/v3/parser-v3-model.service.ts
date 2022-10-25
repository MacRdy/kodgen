import SwaggerParser from '@apidevtools/swagger-parser';
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
		private readonly refs: SwaggerParser.$Refs,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	isSupported(obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): boolean {
		return isOpenApiV3ReferenceObject(obj) || !obj.enum;
	}

	parse(
		name: string,
		obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
		required?: boolean,
	): ModelDef {
		let modelDef: ModelDef;

		if (isOpenApiV3ReferenceObject(obj)) {
			const schema: OpenAPIV3.SchemaObject = this.refs.get(obj.$ref);
			const schemaName = obj.$ref.split('/').pop() as string;

			if (this.repository.hasSource(schema)) {
				modelDef = this.repository.getEntity(schema);
			} else {
				const schemaEntity = this.parseSchemaEntity(schemaName, schema);
				modelDef = new ReferenceDef(schemaName, schemaEntity.ref);
			}
		} else if (obj.type === 'object') {
			const properties: ModelDef[] = [];

			for (const [propName, propObj] of Object.entries(obj.properties ?? [])) {
				const propModelRef = this.parse(
					propName,
					propObj,
					!!obj.required?.find(x => x === propName),
				);

				if (propModelRef instanceof ReferenceDef) {
					const modifiedModelDef = new ReferenceDef(propName, propModelRef.ref);
					properties.push(modifiedModelDef);
				} else {
					properties.push(propModelRef);
				}
			}

			modelDef = new ObjectModelDef(name, properties);
		} else if (obj.type === 'array') {
			const modelName = generateName([name, 'Item']);

			const schemaEntity = this.parseSchemaEntity(modelName, obj.items);

			modelDef = new ArrayModelDef(name, schemaEntity.ref, !!required, !!obj.nullable);
		} else if (isValidPrimitiveType(obj)) {
			modelDef = new PrimitiveModelDef(
				name,
				obj.type,
				obj.format,
				!!required,
				!!obj.nullable,
			);
		} else {
			throw new Error('Unsupported model schema type.');
		}

		if (!isOpenApiV3ReferenceObject(obj)) {
			this.repository.addEntity(obj, modelDef);
		}

		return modelDef;
	}
}
