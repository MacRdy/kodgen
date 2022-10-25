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
import { Reference } from '../entities/reference.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { isValidPrimitiveType } from '../parser.model';
import { isOpenApiV3ReferenceObject, ParseNewSchemaFn } from './parser-v3.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserRepositoryService,
		private readonly refs: SwaggerParser.$Refs,
		private readonly parseNewSchema: ParseNewSchemaFn,
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

			const ref = this.repository.hasSchema(schema)
				? this.repository.getReference(schema)
				: this.parseNewSchema(schemaName, schema);

			modelDef = new ReferenceDef(schemaName, new Reference(ref));
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

			const ref = this.parseNewSchema(modelName, obj.items);

			const entity = this.repository.getEntity(ref);

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
