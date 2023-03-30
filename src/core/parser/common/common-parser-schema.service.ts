import { ArrayModelDef } from '../../../core/entities/schema-entities/array-model-def.model';
import { ConstantModelDef } from '../../../core/entities/schema-entities/constant-model-def.model';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from '../../../core/entities/schema-entities/unknown-model-def.model';
import { ModelDef } from '../../../core/entities/shared.model';
import { mergeParts, toPascalCase } from '../../../core/utils';
import { EnumEntryDef, EnumModelDef } from '../../entities/schema-entities/enum-model-def.model';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	DefaultError,
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
	): ModelDef {
		if (schema.type !== 'string' && schema.type !== 'integer' && schema.type !== 'number') {
			schemaWarning(new DefaultError('Unsupported enum type', [data?.name]));

			return new UnknownModelDef();
		}

		const repository = ParserRepositoryService.getInstance<T>();

		const enumValues = schema.enum ?? [];
		const enumNames = this.getEnumEntryNames(schema);

		if (!enumValues.length) {
			const modelDef = new UnknownModelDef();
			repository.addEntity(modelDef, schema);

			schemaWarning(new UnknownTypeError([data?.name]));

			return modelDef;
		} else if (!enumNames?.length) {
			const modelDef = new ExtendedModelDef(
				'or',
				enumValues.map(x => new ConstantModelDef(x, schema.format)),
				{
					description: schema.description,
					extensions: getExtensions(schema),
				},
			);

			repository.addEntity(modelDef, schema);

			return modelDef;
		}

		const entries = this.getEnumEntries(enumValues, enumNames);

		const enumDef = new EnumModelDef(this.getNameOrDefault(data?.name), schema.type, entries, {
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
				schemaWarning(new UnresolvedReferenceError(schemaItem.$ref));

				continue;
			}

			const modelDef = parseSchemaEntity(schemaItem as T, data);

			def.push(modelDef);
		}

		const extendedModelDef = new ExtendedModelDef(combination === 'allOf' ? 'and' : 'or', def, {
			extensions: getExtensions(schema),
		});

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
		const repository = ParserRepositoryService.getInstance<T>();

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

		const rawPropertyEntries = Object.entries<OpenApiSchemaObject>(schema.properties ?? {});

		if (
			!objectDef.additionalProperties &&
			!rawPropertyEntries.length &&
			!Object.keys(objectDef.extensions).length
		) {
			const modelDef = new UnknownModelDef();
			repository.addEntity(modelDef, schema);

			schemaWarning(new UnknownTypeError([data?.name]));

			return modelDef;
		}

		const modelDef = nullable
			? new ExtendedModelDef('or', [objectDef, new NullModelDef()])
			: objectDef;

		repository.addEntity(modelDef, schema);

		const properties: Property[] = [];

		for (const [propName, propSchema] of rawPropertyEntries) {
			if (isOpenApiReferenceObject(propSchema)) {
				schemaWarning(new UnresolvedReferenceError(propSchema.$ref));

				const prop = new Property(propName, new UnknownModelDef(), {
					required: !!schema.required?.find(x => x === propName),
					extensions: getExtensions(propSchema),
				});

				properties.push(prop);
			} else {
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
			}
		}

		objectDef.properties = properties;

		return modelDef;
	}

	private static parseObjectAdditionalProperties<T extends OpenApiSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: T,
		name?: string,
	): ModelDef | undefined {
		let additionalProperties: ModelDef | undefined;

		if (schema.additionalProperties) {
			if (typeof schema.additionalProperties !== 'boolean') {
				if (isOpenApiReferenceObject(schema.additionalProperties)) {
					schemaWarning(new UnresolvedReferenceError(schema.additionalProperties.$ref));
				} else {
					additionalProperties = parseSchemaEntity(schema.additionalProperties as T, {
						name: mergeParts(this.getNameOrDefault(name), 'additionalProperties'),
					});
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
		const name = mergeParts(this.getNameOrDefault(data?.name), 'Item');

		const items = (schema as Record<string, unknown>).items as T | undefined;

		if (!items) {
			schemaWarning(new UnknownTypeError([name]));

			return new ArrayModelDef(new UnknownModelDef());
		}

		if (isOpenApiReferenceObject(items)) {
			schemaWarning(new UnresolvedReferenceError(items.$ref));

			return new ArrayModelDef(new UnknownModelDef());
		}

		const entity = parseSchemaEntity(items, {
			name,
			origin: data?.origin,
		});

		const arrayDef = new ArrayModelDef(entity);

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
		const xPropNames = ['x-enumNames', 'x-enum-varnames'] as const;

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
