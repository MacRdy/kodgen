import { OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { SchemaEntity } from 'src/core/document.model';
import { EnumDef, EnumEntryDef } from '../entities/enum.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { isIntegerType, isNumberType, isStringType, isValidPrimitiveType } from '../parser.model';
import { isOpenApiV3ReferenceObject } from './parser-v3.model';

export class ParserV3EnumService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
	) {}

	isSupported(obj: OpenAPIV3.SchemaObject): boolean {
		return !isOpenApiV3ReferenceObject(obj) && !!obj.enum;
	}

	parse(name: string, schema: OpenAPIV3.SchemaObject): EnumDef {
		if (isOpenApiV3ReferenceObject(schema)) {
			throw new Error('Unsupported reference object.');
		}

		const entries: EnumEntryDef[] = [];
		const names = this.getNames(schema);

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
					name: names?.[i] ?? this.generateEntryNameByValue(value),
					value,
				};

				entries.push(entry);
			}
		}

		const enumDef = new EnumDef(name, schema.type, entries, schema.format);

		this.repository.addEntity(schema, enumDef);

		return enumDef;
	}

	private getNames(schema: OpenAPIV3.SchemaObject): string[] | undefined {
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

	private generateEntryNameByValue(value: number | string): string {
		return typeof value === 'number'
			? `_${value}`
			: pascalCase(value, { transform: pascalCaseTransformMerge });
	}
}
