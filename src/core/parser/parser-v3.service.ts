import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { IDocument } from '../entities/document.model';
import { IEnum, IEnumEntry } from '../entities/enum.model';
import { IObject } from '../entities/object.model';
import { IPath } from '../entities/path.model';
import { IParserService } from './parser.model';

export class ParserV3Service implements IParserService<OpenAPIV3.Document> {
	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {}

		return false;
	}

	parse(doc: OpenAPIV3.Document): IDocument {
		const enums: IEnum[] = [];
		const objects: IObject[] = [];

		if (doc.components?.schemas) {
			for (const [name, schemaOrRef] of Object.entries(doc.components.schemas)) {
				if (this.isReferenceObject(schemaOrRef)) {
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

	private parseEnum(name: string, schema: OpenAPIV3.SchemaObject): IEnum {
		const entries: IEnumEntry[] = [];
		const names = this.getEnumNames(schema);

		if (schema.type === 'integer' || schema.type === 'number' || schema.type === 'string') {
			const values: Array<number | string> = schema.enum ?? [];

			for (let i = 0; i < values.length; i++) {
				const value = values[i];

				if (typeof value !== 'undefined') {
					const entry: IEnumEntry = {
						name: names?.[i] ?? this.generateEnumEntryNameByValue(value),
						value,
					};

					entries.push(entry);
				}
			}
		} else {
			throw new Error('Unsupported enum type.');
		}

		return {
			name: pascalCase(name, { transform: pascalCaseTransformMerge }),
			type: schema.type,
			entries,
		};
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

	private parseObject(name: string, schema: OpenAPIV3.SchemaObject): IObject {
		return {
			name,
		};
	}

	private getPaths(doc: OpenAPIV3.Document): IPath[] {
		return [];
	}

	private isReferenceObject(
		value: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): value is OpenAPIV3.ReferenceObject {
		return Object.prototype.hasOwnProperty.call<
			OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
			[keyof OpenAPIV3.ReferenceObject],
			boolean
		>(value, '$ref');
	}
}
