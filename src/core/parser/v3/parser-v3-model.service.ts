import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
} from '../entities/model.model';
import {
	isArrayType,
	isObjectType,
	isOpenApiReferenceObject,
	isValidPrimitiveType,
} from '../parser.model';

export class ParserV3ModelService {
	constructor(
		private readonly schemaRefRepository: Map<OpenAPIV3.SchemaObject, string>,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	isSupported(schema: OpenAPIV3.SchemaObject): boolean {
		return isObjectType(schema.type);
	}

	parse(name: string, schema: OpenAPIV3.SchemaObject): ModelDef {
		if (isObjectType(schema.type)) {
			if (!schema.properties) {
				throw new Error('Unsupported model with no properties.');
			}

			const properties: ModelDef[] = [];

			for (const [srcPropName, srcProp] of Object.entries(schema.properties)) {
				if (isOpenApiReferenceObject(srcProp)) {
					throw new Error('Unsupported nested reference object.');
				}

				if (isArrayType(srcProp.type)) {
					const arrayItemDef = this.parse(`${name}${srcPropName}Item`, srcProp);

					const prop = new ArrayModelDef(
						srcPropName,
						arrayItemDef,
						!!schema.required?.find(x => x === srcPropName),
						!!srcProp.nullable,
					);

					properties.push(prop);
				} else if (isObjectType(srcProp.type)) {
					const modelDef = this.parse(`${name}${srcPropName}Data`, srcProp);

					properties.push(modelDef);
				} else if (isValidPrimitiveType(srcProp)) {
					const prop = new PrimitiveModelDef(
						srcPropName,
						srcProp.type,
						srcProp.format,
						!!schema.required?.find(x => x === srcPropName),
						!!srcProp.nullable,
					);

					properties.push(prop);
				} else {
					throw new Error('Unsupported property type.');
				}
			}

			const modelDef = new ObjectModelDef(name, properties);

			if (!this.schemaRefRepository.has(schema)) {
				this.schemaRefRepository.set(schema, modelDef.ref.get());
			} else {
				throw new Error('Model schema is already parsed.');
			}

			return modelDef;
		}

		if (isArrayType(schema.type)) {
		}

		throw new Error('Unsupported model schema type.');
	}
}
