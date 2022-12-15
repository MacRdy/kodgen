import { EnumDef, EnumEntryDef } from 'core/entities/schema-entities/enum-def.model';
import { ExtendedModelDef } from 'core/entities/schema-entities/extended-model-def.model';
import { ModelDef, SchemaEntity } from 'core/entities/shared.model';
import { toPascalCase } from 'core/utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	getExtensions,
	IParseSchemaData,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	UnresolvedReferenceError,
} from '../parser.model';
import { AnyOpenApiSchemaObject, AnyV3OpenApiSchemaObject } from './common-parser.model';

export class CommonParserSchemaService {
	static parseEnum<T extends AnyOpenApiSchemaObject>(
		repository: ParserRepositoryService<T, SchemaEntity>,
		schema: T,
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

	static parseCombination<T extends AnyV3OpenApiSchemaObject>(
		repository: ParserRepositoryService<T, SchemaEntity>,
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		combination: 'allOf' | 'anyOf' | 'oneOf',
		schema: T,
		data?: IParseSchemaData,
	): ModelDef {
		const def: ModelDef[] = [];

		const collection = schema[combination] ?? [];

		for (const schemaItem of collection) {
			if (isOpenApiReferenceObject(schemaItem)) {
				throw new UnresolvedReferenceError();
			}

			const modelDef = parseSchemaEntity(schemaItem as T, data);

			def.push(modelDef);
		}

		const modelDef = new ExtendedModelDef(combination === 'allOf' ? 'and' : 'or', def);

		repository.addEntity(modelDef, schema);

		return modelDef;
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
