import { EnumDef, EnumEntryDef } from 'core/entities/schema-entities/enum-def.model';
import { SchemaEntity } from 'core/entities/shared.model';
import { toPascalCase } from 'core/utils';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, IParseSchemaData } from '../parser.model';
import { AnyOpenApiSchemaObject } from './common-parser.model';

export class CommonParserSchemaService {
	static parseEnum(
		repository: ParserRepositoryService<AnyOpenApiSchemaObject, SchemaEntity>,
		schema: AnyOpenApiSchemaObject,
		data?: IParseSchemaData,
	): EnumDef {
		if (schema.type !== 'string' && schema.type !== 'integer' && schema.type !== 'number') {
			throw new Error('Unsupported enum type.');
		}

		const entries = this.getEnumEntries(schema.enum ?? [], this.getEnumEntryNames(schema));

		const enumDef = new EnumDef(this.getNameOrDefault(data?.name), schema.type, entries, {
			deprecated: !!schema.deprecated,
			description: schema.description,
			format: schema.format,
			origin: data?.origin,
			originalName: data?.originalName,
			extensions: getExtensions(schema),
		});

		repository.addEntity(enumDef, schema);

		return enumDef;
	}

	private static getNameOrDefault(name?: string): string {
		return name ?? 'Unknown';
	}

	private static getEnumEntries<T>(values: T[], names?: string[]): EnumEntryDef[] {
		const entries: EnumEntryDef[] = [];

		for (let i = 0; i < values.length; i++) {
			const value = values[i];

			if (typeof value !== 'undefined') {
				const entry = new EnumEntryDef(
					names?.[i] ?? this.generateEnumEntryNameByValue(value),
					value,
				);

				entries.push(entry);
			}
		}

		return entries;
	}

	private static getEnumEntryNames(schema: AnyOpenApiSchemaObject): string[] | undefined {
		const xPropNames = ['x-enumNames', 'x-ms-enum', 'x-enum-varnames'] as const;

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

	private static generateEnumEntryNameByValue(value: unknown): string {
		return typeof value === 'string' ? toPascalCase(value) : `_${value}`;
	}
}
