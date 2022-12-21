import { ArrayModelDef } from '../../../core/entities/schema-entities/array-model-def.model';
import { EnumDef, EnumEntryDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from '../../../core/entities/schema-entities/unknown-model-def.model';
import { ModelDef, SchemaEntity } from '../../../core/entities/shared.model';
import { mergeParts, toPascalCase } from '../../../core/utils';
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
import { OpenApiSchemaObject, OpenApiV3xSchemaObject } from './common-parser.model';

export class CommonParserSchemaService {
	static parseEnum<T extends OpenApiSchemaObject>(
		schema: T,
		data?: IParseSchemaData,
		nullable?: boolean,
	): SchemaEntity {
		if (schema.type !== 'string' && schema.type !== 'integer' && schema.type !== 'number') {
			schemaWarning([data?.name], new Error('Unsupported enum type'));

			return new UnknownModelDef();
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

		const modelDef = nullable
			? new ExtendedModelDef('or', [enumDef, new NullModelDef()])
			: enumDef;

		const repository = ParserRepositoryService.getInstance<T>();

		repository.addEntity(modelDef, schema);

		return modelDef;
	}

	static parseCombination<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		combination: 'allOf' | 'anyOf' | 'oneOf',
		schema: T,
		data?: IParseSchemaData,
	): ModelDef {
		const def: ModelDef[] = [];

		const collection = schema[combination] ?? [];

		for (const schemaItem of collection) {
			if (isOpenApiReferenceObject(schemaItem)) {
				throw new UnresolvedReferenceError(schemaItem.$ref);
			}

			const modelDef = parseSchemaEntity(schemaItem as T, data);

			def.push(modelDef);
		}

		const extendedModelDef = new ExtendedModelDef(combination === 'allOf' ? 'and' : 'or', def);

		const repository = ParserRepositoryService.getInstance<T>();

		repository.addEntity(extendedModelDef, schema);

		return extendedModelDef;
	}

	static parseObject<T extends OpenApiSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: T,
		data?: IParseSchemaData,
		nullable?: boolean,
	): ModelDef {
		const additionalProperties = this.parseObjectAdditionalProperties(
			parseSchemaEntity,
			schema,
			data?.name,
		);

		const modelName = this.getNameOrDefault(data?.name);

		const objectDef = new ObjectModelDef(modelName, {
			deprecated: schema.deprecated,
			description: schema.description,
			origin: data?.origin,
			originalName: data?.originalName,
			extensions: getExtensions(schema),
			additionalProperties,
		});

		const modelDef = nullable
			? new ExtendedModelDef('or', [objectDef, new NullModelDef()])
			: objectDef;

		const repository = ParserRepositoryService.getInstance<T>();

		repository.addEntity(modelDef, schema);

		const properties: Property[] = [];

		for (const [propName, propSchema] of Object.entries<OpenApiSchemaObject>(
			schema.properties ?? [],
		)) {
			try {
				if (isOpenApiReferenceObject(propSchema)) {
					throw new UnresolvedReferenceError(propSchema.$ref);
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

		objectDef.properties = properties;

		return modelDef;
	}

	private static parseObjectAdditionalProperties<T extends OpenApiSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: T,
		name?: string,
	): SchemaEntity | undefined {
		let additionalProperties: SchemaEntity | undefined;

		if (schema.additionalProperties) {
			if (typeof schema.additionalProperties !== 'boolean') {
				try {
					if (isOpenApiReferenceObject(schema.additionalProperties)) {
						throw new UnresolvedReferenceError(schema.additionalProperties.$ref);
					}

					additionalProperties = parseSchemaEntity(schema.additionalProperties as T, {
						name: mergeParts(this.getNameOrDefault(name), 'additionalProperties'),
					});
				} catch (e) {
					schemaWarning([name, 'additionalProperties'], e);
				}
			}

			additionalProperties ??= new UnknownModelDef();
		}

		return additionalProperties;
	}

	static parseArray<T extends OpenApiSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: T,
		data?: IParseSchemaData,
		nullable?: boolean,
	): ModelDef {
		let arrayDef: ArrayModelDef;

		try {
			const name = mergeParts(this.getNameOrDefault(data?.name), 'Item');

			const items = (schema as Record<string, unknown>).items as T | undefined;

			if (!items) {
				schemaWarning([name], new UnknownTypeError());

				return new ArrayModelDef(new UnknownModelDef());
			}

			if (isOpenApiReferenceObject(items)) {
				throw new UnresolvedReferenceError(items.$ref);
			}

			const entity = parseSchemaEntity(items, {
				name,
				origin: data?.origin,
			});

			arrayDef = new ArrayModelDef(entity);
		} catch (e) {
			schemaWarning([data?.name], e);

			arrayDef = new ArrayModelDef(new UnknownModelDef());
		}

		return nullable ? new ExtendedModelDef('or', [arrayDef, new NullModelDef()]) : arrayDef;
	}

	static parseSimple(type: string, format?: string, nullable?: boolean): ModelDef {
		const simpleDef = new SimpleModelDef(type, { format });

		return nullable ? new ExtendedModelDef('or', [simpleDef, new NullModelDef()]) : simpleDef;
	}

	static getNameOrDefault(name?: string): string {
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

	private static getEnumEntryNames(schema: OpenApiSchemaObject): string[] | undefined {
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

	static generateEnumEntryNameByValue(value: unknown): string {
		return typeof value === 'string' ? toPascalCase(value) : `_${value}`;
	}
}
