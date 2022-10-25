import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceDef,
} from '../entities/model.model';
import { isValidPrimitiveType } from '../parser.model';
import { ParserV3RepositoryService } from './parser-v3-repository.service';
import { isOpenApiV3ReferenceObject, ParseEntityFn } from './parser-v3.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserV3RepositoryService,
		private readonly refs: SwaggerParser.$Refs,
		private readonly parseEntity: ParseEntityFn,
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

			if (this.repository.hasSchema(schema)) {
				modelDef = this.repository.getEntity(schema);
			} else {
				const entity = this.parseEntity(schemaName, schema);
				modelDef = new ReferenceDef(schemaName, entity.ref);
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
			const modelName = this.getName([name, 'Item']);

			const entity = this.parseEntity(modelName, obj.items);

			modelDef = new ArrayModelDef(name, entity.ref, !!required, !!obj.nullable);
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

	private getName(parts: string[]): string {
		return pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });
	}
}
