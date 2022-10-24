import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
} from '../entities/model.model';
import { ReferenceDef } from '../entities/reference.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { isObjectType, isOpenApiReferenceObject, isValidPrimitiveType } from '../parser.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserRepositoryService,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	isSupported(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): boolean {
		return true; // isObjectType(schema.type);
	}

	parse(
		name: string,
		obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
		parseFn: (
			name: string,
			obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
		) => ReferenceDef,
	): ModelDef {
		if (isOpenApiReferenceObject(obj)) {
			const schema = this.refs.get(obj.$ref);

			return !!this.repository.hasSchema(schema)
				? this.repository.getReference(schema)
				: parseFn(name, schema);
		} else if (isObjectType(obj.type)) {
			const properties: ModelDef[] = [];

			for (const [srcPropName, srcProp] of Object.entries(obj.properties ?? [])) {
				if (isOpenApiReferenceObject(srcProp)) {
					const modelDef = parseFn(name, srcProp);

					properties.push(modelDef);
				} else if (srcProp.type === 'array') {
					const modelName = this.getName([name, srcPropName, 'Item']);

					const arrayItemDef = parseFn(modelName, srcProp.items);

					const modelDef = new ArrayModelDef(
						srcPropName,
						arrayItemDef,
						!!obj.required?.find(x => x === srcPropName),
						!!srcProp.nullable,
					);

					this.repository.addEntity(obj, modelDef);

					properties.push(modelDef);
				} else if (srcProp.type === 'object') {
					const modelName = this.getName([name, srcPropName]);

					const modelDef = this.parse(modelName, srcProp, parseFn);

					properties.push(modelDef);
				} else {
					const prop = this.parse(srcPropName, srcProp, parseFn);

					properties.push(prop);
				}
			}

			const modelDef = new ObjectModelDef(name, properties);

			this.repository.addEntity(obj, modelDef);

			return modelDef;
		} else if (isValidPrimitiveType(obj)) {
			const modelDef = new PrimitiveModelDef(
				name,
				obj.type,
				obj.format,
				// !!schema.required?.find(x => x === srcPropName),
				!!obj.nullable,
			);

			this.repository.addEntity(obj, modelDef);

			return modelDef;
		}

		throw new Error('Unsupported model schema type.');
	}

	private getName(parts: string[]): string {
		return pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });
	}
}
