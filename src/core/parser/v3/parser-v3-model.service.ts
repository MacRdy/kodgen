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

			for (const [propName, propObj] of Object.entries(obj.properties ?? [])) {
				if (isOpenApiReferenceObject(propObj)) {
					const schema = this.refs.get(propObj.$ref);
					const processed = this.repository.hasSchema(schema);

					if (processed) {
						const ref = this.repository.getReference(schema);
						properties.push(ref);
					} else {
						const schemaName = propObj.$ref.split('/').pop();
						const ref = parseFn(schemaName ?? this.getName([name, propName]), propObj);
						properties.push(ref);
					}
				} else {
					let modelName: string = propName;

					// if (isObjectType(propObj.type)) {
					// 	modelName = this.getName([name, propName]);
					// } else if (isArrayType(propObj.type)) {
					// 	modelName = this.getName([name, 'Item']);
					// } else {
					// 	modelName = propName;
					// }

					const modelRef = this.parse(modelName, propObj, parseFn);

					properties.push(modelRef);
				}
			}

			const modelDef = new ObjectModelDef(name, properties);

			this.repository.addEntity(obj, modelDef);

			return modelDef;
		} else if (obj.type === 'array') {
			const modelName = this.getName([name, 'Item']);

			const arrayItemDef = parseFn(modelName, obj.items);

			const modelDef = new ArrayModelDef(
				name,
				arrayItemDef,
				false, // !!obj.required?.find(x => x === srcPropName),
				!!obj.nullable,
			);

			this.repository.addEntity(obj, modelDef);

			return modelDef;
		} else if (isValidPrimitiveType(obj)) {
			const modelDef = new PrimitiveModelDef(
				name,
				obj.type,
				obj.format,
				false, // !!schema.required?.find(x => x === srcPropName),
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
