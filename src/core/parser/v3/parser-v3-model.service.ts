import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
} from '../entities/model.model';
import { ReferenceDef } from '../entities/reference.model';
import { isObjectType, isOpenApiReferenceObject, isValidPrimitiveType } from '../parser.model';

export class ParserV3ModelService {
	constructor(
		private readonly schemaRefRepository: Map<OpenAPIV3.SchemaObject, ReferenceDef>,
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

			const ref = this.schemaRefRepository.get(schema);

			return !!ref ? ref : parseFn(name, schema);
		} else if (isObjectType(obj.type)) {
			const schema = obj;

			if (!schema.properties) {
				throw new Error('Unsupported model with no properties.');
			}

			const properties: ModelDef[] = [];

			for (const [srcPropName, srcProp] of Object.entries(schema.properties)) {
				if (isOpenApiReferenceObject(srcProp)) {
					const modelDef = parseFn(name, srcProp);

					properties.push(modelDef);
				} else if (srcProp.type === 'array') {
					const arrayItemDef = parseFn(`${name}${srcPropName}Item`, srcProp.items);

					const prop = new ArrayModelDef(
						srcPropName,
						arrayItemDef,
						!!schema.required?.find(x => x === srcPropName),
						!!srcProp.nullable,
					);

					properties.push(prop);
				} else if (srcProp.type === 'object') {
					const modelDef = this.parse(`${name}${srcPropName}Data`, srcProp, parseFn);

					properties.push(modelDef);
				} else {
					const prop = this.parse(srcPropName, srcProp, parseFn);

					properties.push(prop);
				}
			}

			const modelDef = new ObjectModelDef(name, properties);

			if (!this.schemaRefRepository.has(schema)) {
				this.schemaRefRepository.set(schema, modelDef.ref);
			} else {
				throw new Error('Model schema is already parsed.');
			}

			return modelDef;
		} else if (isValidPrimitiveType(obj)) {
			const prop = new PrimitiveModelDef(
				name,
				obj.type,
				obj.format,
				// !!schema.required?.find(x => x === srcPropName),
				!!obj.nullable,
			);

			return prop;
		}

		throw new Error('Unsupported model schema type.');
	}
}
