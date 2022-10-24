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
import { isObjectType, isOpenApiReferenceObject, isValidPrimitiveType } from '../parser.model';

export class ParserV3ModelService {
	constructor(
		private readonly repository: ParserRepositoryService,
		private readonly refs: SwaggerParser.$Refs,
		private readonly parseNewSchema: (
			name: string,
			obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
		) => Reference,
	) {}

	isSupported(schema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): boolean {
		return true; // isObjectType(schema.type);
	}

	parse(name: string, obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): ModelDef {
		let modelDef: ModelDef;

		if (isOpenApiReferenceObject(obj)) {
			const schema: OpenAPIV3.SchemaObject = this.refs.get(obj.$ref);
			const schemaName = obj.$ref.split('/').pop();

			const ref = !!this.repository.hasSchema(schema)
				? this.repository.getReference(schema)
				: this.parseNewSchema(schemaName!, schema); // !!!!!!!!!!!

			modelDef = new ReferenceDef(schemaName!, ref); // !!!!!!!!!!!
		} else if (isObjectType(obj.type)) {
			const properties: ModelDef[] = [];

			for (const [propName, propObj] of Object.entries(obj.properties ?? [])) {
				if (isOpenApiReferenceObject(propObj)) {
					const schema: OpenAPIV3.SchemaObject = this.refs.get(propObj.$ref);
					const processed = this.repository.hasSchema(schema);

					if (processed) {
						const ref = this.repository.getReference(schema);

						const refDef = new ReferenceDef(propName, ref);
						properties.push(refDef);
					} else {
						const ref = this.parseNewSchema(propName, propObj);

						const refDef = new ReferenceDef(propName, ref);
						properties.push(refDef);
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

					const modelRef = this.parse(modelName, propObj);

					properties.push(modelRef);
				}
			}

			modelDef = new ObjectModelDef(name, properties);
		} else if (obj.type === 'array') {
			const modelName = this.getName([name, 'Item']);

			const ref = this.parseNewSchema(modelName, obj.items);

			const entity = this.repository.getEntity(ref);

			modelDef = new ArrayModelDef(
				name,
				entity.ref,
				false, // !!obj.required?.find(x => x === srcPropName),
				!!obj.nullable,
			);
		} else if (isValidPrimitiveType(obj)) {
			modelDef = new PrimitiveModelDef(
				name,
				obj.type,
				obj.format,
				false, // !!schema.required?.find(x => x === srcPropName),
				!!obj.nullable,
			);
		} else {
			throw new Error('Unsupported model schema type.');
		}

		if (!isOpenApiReferenceObject(obj)) {
			this.repository.addEntity(obj, modelDef);
		}

		return modelDef;
	}

	private getName(parts: string[]): string {
		return pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });
	}
}
