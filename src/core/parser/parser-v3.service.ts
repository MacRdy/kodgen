import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { IDocument } from '../document.model';
import { EnumDef, EnumEntryDef } from './entities/enum.model';
import { ObjectDef, ObjectProperty, PrimitiveObjectProperty } from './entities/object.model';
import { PathDef } from './entities/path.model';
import {
	IParserService,
	isCompletelyValidType,
	isIntegerType,
	isNumberType,
	isReferenceObject,
	isStringType,
} from './parser.model';

export class ParserV3Service implements IParserService<OpenAPIV3.Document> {
	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {}

		return false;
	}

	parse(doc: OpenAPIV3.Document, refs: SwaggerParser.$Refs): IDocument {
		const enums: EnumDef[] = [];
		const objects: ObjectDef[] = [];

		if (doc.components?.schemas) {
			for (const [name, schemaOrRef] of Object.entries(doc.components.schemas)) {
				if (isReferenceObject(schemaOrRef)) {
					throw new Error('Unsupported reference object.');
				}

				if (this.isEnum(schemaOrRef)) {
					enums.push(this.parseEnum(name, schemaOrRef));
				}

				if (this.isObject(schemaOrRef)) {
					objects.push(this.parseObject(name, schemaOrRef));
				}
			}
		}

		return {
			enums,
			objects,
			paths: this.getPaths(doc),
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
			!isCompletelyValidType(schema)
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

	private isObject(schema: OpenAPIV3.SchemaObject): boolean {
		return schema.type === 'object';
	}

	private parseObject(name: string, schema: OpenAPIV3.SchemaObject): ObjectDef {
		if (!schema.properties) {
			throw new Error('Unsupported object with no properties.');
		}

		const properties: ObjectProperty[] = [];

		for (const [srcPropName, srcProp] of Object.entries(schema.properties)) {
			if (isReferenceObject(srcProp)) {
				throw new Error('Unsupported nested reference object.');
			}

			if (!isCompletelyValidType(srcProp)) {
				throw new Error('Invalid property type.');
			}

			const prop: PrimitiveObjectProperty = {
				name: srcPropName,
				type: srcProp.type,
				format: srcProp.format,
				nullable: !!srcProp.nullable,
				required: !!srcProp.required,
				isArray: false,
			};

			properties.push(prop);
		}

		return new ObjectDef(name, properties);
	}

	private getPaths(doc: OpenAPIV3.Document): PathDef[] {
		return [];
	}
}
