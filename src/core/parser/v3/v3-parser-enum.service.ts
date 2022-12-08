import { OpenAPIV3 } from 'openapi-types';
import { toPascalCase } from '../../../core/utils';
import { EnumDef, EnumEntryDef } from '../../entities/schema-entities/enum-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, IParseSchemaData } from '../parser.model';

export class V3ParserEnumService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
	) {}

	isSupported(obj: OpenAPIV3.SchemaObject): boolean {
		return !!obj.enum;
	}

	parse(schema: OpenAPIV3.SchemaObject, data?: IParseSchemaData): EnumDef {
		if (schema.type !== 'string' && schema.type !== 'integer' && schema.type !== 'number') {
			throw new Error('Unsupported enum type.');
		}

		const entries = this.getEntries(schema.enum ?? [], this.getNames(schema));

		const enumDef = new EnumDef(this.getNameOrDefault(data?.name), schema.type, entries, {
			deprecated: !!schema.deprecated,
			description: schema.description,
			format: schema.format,
			origin: data?.origin,
			originalName: data?.originalName,
			extensions: getExtensions(schema),
		});

		this.repository.addEntity(enumDef, schema);

		return enumDef;
	}

	private getNameOrDefault(name?: string): string {
		return name ?? 'Unknown';
	}

	private getEntries<T>(values: T[], names?: string[]): EnumEntryDef[] {
		const entries: EnumEntryDef[] = [];

		for (let i = 0; i < values.length; i++) {
			const value = values[i];

			if (typeof value !== 'undefined') {
				const entry = new EnumEntryDef(
					names?.[i] ?? this.generateEntryNameByValue(value),
					value,
				);

				entries.push(entry);
			}
		}

		return entries;
	}

	private getNames(schema: OpenAPIV3.SchemaObject): string[] | undefined {
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

	private generateEntryNameByValue(value: unknown): string {
		return typeof value === 'string' ? toPascalCase(value) : `_${value}`;
	}
}
