import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { IDocument } from '../../document.model';
import { EnumDef, EnumEntryDef } from '../entities/enum.model';
import { ModelDef, ObjectModelDef, PrimitiveModelDef } from '../entities/model.model';
import { PathDef } from '../entities/path.model';
import {
	IParserService,
	isArrayType,
	isIntegerType,
	isNumberType,
	isObjectType,
	isOpenApiReferenceObject,
	isStringType,
	isValidPrimitiveType,
} from '../parser.model';

export class ParserV3Service implements IParserService {
	private readonly repository = new Map<string, EnumDef | ModelDef>();

	constructor(
		private readonly doc: OpenAPIV3.Document,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	parse(): IDocument {
		const enums: EnumDef[] = [];
		const models: ModelDef[] = [];

		if (this.doc.components?.schemas) {
			for (const [name, schemaOrRef] of Object.entries(this.doc.components.schemas)) {
				if (isOpenApiReferenceObject(schemaOrRef)) {
					throw new Error('Unsupported reference object.');
				}

				if (this.isEnum(schemaOrRef)) {
					const enumDef = this.parseEnum(name, schemaOrRef);

					this.repository.set(enumDef.name, enumDef);
					enums.push(enumDef);
				}

				if (isObjectType(schemaOrRef.type)) {
					const modelDef = this.parseModel(name, schemaOrRef);

					this.repository.set(modelDef.name, modelDef);
					models.push(modelDef);
				}
			}
		}

		return {
			enums,
			models,
			paths: this.getPaths(),
		};
	}

	private isEnum(schema: OpenAPIV3.SchemaObject): boolean {
		return !!schema.enum;
	}

	private parseEnum(name: string, schema: OpenAPIV3.SchemaObject): EnumDef {
		const entries: EnumEntryDef[] = [];
		const names = this.getEnumNames(schema);

		if (
			!(
				isIntegerType(schema.type) ||
				isNumberType(schema.type) ||
				isStringType(schema.type)
			) ||
			!isValidPrimitiveType(schema)
		) {
			throw new Error('Unsupported enum type.');
		}

		const values: Array<number | string> = schema.enum ?? [];

		for (let i = 0; i < values.length; i++) {
			const value = values[i];

			if (typeof value !== 'undefined') {
				const entry: EnumEntryDef = {
					name: names?.[i] ?? this.generateEnumEntryNameByValue(value),
					value,
				};

				entries.push(entry);
			}
		}

		return new EnumDef(name, schema.type, entries, schema.format);
	}

	private getEnumNames(schema: OpenAPIV3.SchemaObject): string[] | undefined {
		const xPropNames = ['x-enumNames', 'x-ms-enum', 'x-enumNames'] as const;

		for (const propName of xPropNames) {
			if (Object.prototype.hasOwnProperty.call(schema, propName)) {
				const names = (schema as Record<string, unknown>)[propName] as string[];

				if (Array.isArray(names)) {
					return names;
				}
			}
		}

		return undefined;
	}

	private generateEnumEntryNameByValue(value: number | string): string {
		return typeof value === 'number'
			? `_${value}`
			: pascalCase(value, { transform: pascalCaseTransformMerge });
	}

	private parseModel(name: string, schema: OpenAPIV3.SchemaObject): ModelDef {
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

	private getPaths(): PathDef[] {
		return [];
	}
}
