import { OpenAPIV3_1 } from 'openapi-types';
import { EnumEntryDef, EnumModelDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ExtendedModelDef } from '../../entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../entities/schema-entities/null-model-def.model';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { ModelDef } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ICommonParserSchemaService } from '../common/common-parser.model';
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

export class V31ParserSchemaService
	implements ICommonParserSchemaService<OpenAPIV3_1.SchemaObject>
{
	constructor(
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	parse(schema: OpenAPIV3_1.SchemaObject, data?: IParseSchemaData): ModelDef {
		if (schema.enum) {
			return CommonParserSchemaService.parseEnum(schema, data);
		} else if (this.canParseOneOfAsEnum(schema)) {
			return this.parseOneOfAsEnum(schema, data);
		} else if (schema.allOf?.length) {
			return CommonParserSchemaService.parseCombination(
				this.parseSchemaEntity,
				'allOf',
				schema,
				data,
			);
		} else if (schema.oneOf?.length) {
			return CommonParserSchemaService.parseCombination(
				this.parseSchemaEntity,
				'oneOf',
				schema,
				data,
			);
		} else if (schema.anyOf?.length) {
			return CommonParserSchemaService.parseCombination(
				this.parseSchemaEntity,
				'anyOf',
				schema,
				data,
			);
		} else if (schema.type === 'object') {
			return CommonParserSchemaService.parseObject(this.parseSchemaEntity, schema, data);
		} else if (schema.type === 'array') {
			return CommonParserSchemaService.parseArray(this.parseSchemaEntity, schema, data);
		} else if (schema.type) {
			return this.parseSimple(schema, data?.name);
		}

		schemaWarning([data?.name], new UnknownTypeError());

		return new UnknownModelDef();
	}

	private parseSimple(schema: OpenAPIV3_1.SchemaObject, name?: string): ModelDef {
		if (!schema.type) {
			schemaWarning([name], new UnknownTypeError());

			return new UnknownModelDef();
		}

		if (Array.isArray(schema.type)) {
			const defs: ModelDef[] = [];

			for (const type of schema.type) {
				const def =
					type === 'null'
						? new NullModelDef()
						: CommonParserSchemaService.parseSimple(type, schema.format);

				defs.push(def);
			}

			return new ExtendedModelDef('or', defs);
		} else if (schema.type === 'null') {
			return new NullModelDef();
		} else {
			return CommonParserSchemaService.parseSimple(schema.type, schema.format);
		}
	}

	private canParseOneOfAsEnum(schema: OpenAPIV3_1.SchemaObject): boolean {
		return !!schema.oneOf?.every(
			x => !isOpenApiReferenceObject(x) && Object.prototype.hasOwnProperty.call(x, 'const'),
		);
	}

	private parseOneOfAsEnum(schema: OpenAPIV3_1.SchemaObject, data?: IParseSchemaData): ModelDef {
		if (schema.type !== 'string' && schema.type !== 'integer' && schema.type !== 'number') {
			schemaWarning([data?.name], 'Unsupported enum type');

			return new UnknownModelDef();
		}

		const entries = this.getOneOfEnumEntries(schema.oneOf ?? []);

		const enumDef = new EnumModelDef(
			CommonParserSchemaService.getNameOrDefault(data?.name),
			schema.type,
			entries,
			{
				deprecated: !!schema.deprecated,
				description: schema.description,
				format: schema.format,
				origin: data?.origin,
				originalName: data?.originalName,
				extensions: getExtensions(schema),
			},
		);

		const repository = ParserRepositoryService.getInstance<OpenAPIV3_1.SchemaObject>();

		repository.addEntity(enumDef, schema);

		return enumDef;
	}

	private getOneOfEnumEntries(
		rawEntries: (OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject)[],
	): EnumEntryDef[] {
		const entries: EnumEntryDef[] = [];

		for (const rawEntry of rawEntries) {
			if (isOpenApiReferenceObject(rawEntry)) {
				throw new UnresolvedReferenceError(rawEntry.$ref);
			}

			const value = (rawEntry as Record<string, unknown>)['const'];

			const entry = new EnumEntryDef(
				rawEntry.title ?? CommonParserSchemaService.generateEnumEntryNameByValue(value),
				value,
				{
					deprecated: !!rawEntry.deprecated,
					description: rawEntry.description,
					extensions: getExtensions(rawEntry),
				},
			);

			entries.push(entry);
		}

		return entries;
	}
}
