import { OpenAPIV3 } from 'openapi-types';
import { ModelDef, ObjectModelDef, PrimitiveModelDef } from '../entities/model.model';
import {
	isArrayType,
	isObjectType,
	isOpenApiReferenceObject,
	isValidPrimitiveType,
} from '../parser.model';

export class ParserV3ModelService {
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

				if (srcProp.type === 'array') {
				} else if (srcProp.type === 'object') {
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
					throw new Error('Invalid property type.');
				}
			}

			return new ObjectModelDef(name, properties);
		}

		if (isArrayType(schema.type)) {
		}

		throw new Error();
	}
}
