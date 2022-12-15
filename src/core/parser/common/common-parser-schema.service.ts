import { ArrayModelDef } from 'core/entities/schema-entities/array-model-def.model';
import { EnumDef, EnumEntryDef } from 'core/entities/schema-entities/enum-def.model';
import { ExtendedModelDef } from 'core/entities/schema-entities/extended-model-def.model';
import { ObjectModelDef } from 'core/entities/schema-entities/object-model-def.model';
import { Property } from 'core/entities/schema-entities/property.model';
import { SimpleModelDef } from 'core/entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from 'core/entities/schema-entities/unknown-model-def.model';
import { ModelDef, SchemaEntity } from 'core/entities/shared.model';
import { mergeParts, toPascalCase } from 'core/utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	getExtensions,
	IParseSchemaData,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	schemaWarning,
	UnknownTypeError,
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

	static parseObject<T extends AnyOpenApiSchemaObject>(
		repository: ParserRepositoryService<T, SchemaEntity>,
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: T,
		data?: IParseSchemaData,
	): ModelDef {
		let additionalProperties: SchemaEntity | undefined;

		if (schema.additionalProperties) {
			if (typeof schema.additionalProperties !== 'boolean') {
				try {
					if (isOpenApiReferenceObject(schema.additionalProperties)) {
						throw new UnresolvedReferenceError();
					}

					additionalProperties = parseSchemaEntity(schema.additionalProperties as T, {
						name: mergeParts(this.getNameOrDefault(data?.name), 'additionalProperties'),
					});
				} catch (e) {
					schemaWarning([data?.name, 'additionalProperties'], e);
				}
			}

			additionalProperties ??= new UnknownModelDef();
		}

		const modelName = this.getNameOrDefault(data?.name);

		const modelDef = new ObjectModelDef(modelName, {
			deprecated: schema.deprecated,
			description: schema.description,
			origin: data?.origin,
			originalName: data?.originalName,
			extensions: getExtensions(schema),
			additionalProperties,
		});

		repository.addEntity(modelDef, schema);

		const properties: Property[] = [];

		for (const [propName, propSchema] of Object.entries<AnyOpenApiSchemaObject>(
			schema.properties ?? [],
		)) {
			try {
				if (isOpenApiReferenceObject(propSchema)) {
					throw new UnresolvedReferenceError();
				}

				const propDef = parseSchemaEntity(propSchema as T, {
					name: mergeParts(modelName, propName),
					origin: data?.origin,
				});

				const prop = new Property(propName, propDef, {
					required: !!schema.required?.find(x => x === propName),
					deprecated: propSchema.deprecated,
					readonly: propSchema.readOnly,
					writeonly: propSchema.writeOnly,
					description: propSchema.description,
					extensions: getExtensions(propSchema),
				});

				properties.push(prop);
			} catch (e) {
				schemaWarning([data?.name, propName], e);
			}
		}

		modelDef.properties = properties;

		return modelDef;
	}

	static parseArray<T extends AnyOpenApiSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: T,
		data?: IParseSchemaData,
	): ModelDef {
		try {
			const name = mergeParts(this.getNameOrDefault(data?.name), 'Item');

			const items = (schema as Record<string, unknown>).items as T | undefined;

			if (!items) {
				schemaWarning([name], new UnknownTypeError());

				return new ArrayModelDef(new UnknownModelDef());
			}

			if (isOpenApiReferenceObject(items)) {
				throw new UnresolvedReferenceError();
			}

			const entity = parseSchemaEntity(items, {
				name,
				origin: data?.origin,
			});

			return new ArrayModelDef(entity);
		} catch (e) {
			schemaWarning([data?.name], e);

			return new ArrayModelDef(new UnknownModelDef());
		}
	}

	static parseSimple(type: string, format?: string): ModelDef {
		return new SimpleModelDef(type, { format });
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
