import { OpenAPIV3_1 } from 'openapi-types';
import { EnumEntry, EnumModel } from '../../entities/model/enum-model.model';
import { ExtendedModel } from '../../entities/model/extended-model.model';
import { NullModel } from '../../entities/model/null-model.model';
import { UnknownModel } from '../../entities/model/unknown-model.model';
import { Model } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ICommonParserSchemaService } from '../common/common-parser.model';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	DefaultError,
	IParseSchemaData,
	ParseSchemaEntityFn,
	UnknownTypeError,
	UnresolvedReferenceError,
	getExtensions,
	isOpenApiReferenceObject,
	schemaWarning,
} from '../parser.model';

export class V31ParserSchemaService
	implements ICommonParserSchemaService<OpenAPIV3_1.SchemaObject>
{
	constructor(
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	parse(schema: OpenAPIV3_1.SchemaObject, data?: IParseSchemaData): Model {
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

		schemaWarning(new UnknownTypeError([data?.name]));

		return new UnknownModel();
	}

	private parseSimple(schema: OpenAPIV3_1.SchemaObject, name?: string): Model {
		if (!schema.type) {
			schemaWarning(new UnknownTypeError([name]));

			return new UnknownModel();
		}

		if (Array.isArray(schema.type)) {
			const defs: Model[] = [];

			for (const type of schema.type) {
				const def =
					type === 'null'
						? new NullModel()
						: CommonParserSchemaService.parseSimple(
								type,
								schema.format,
								false,
								schema.description,
						  );

				defs.push(def);
			}

			return new ExtendedModel('or', defs);
		} else if (schema.type === 'null') {
			return new NullModel();
		} else {
			return CommonParserSchemaService.parseSimple(
				schema.type,
				schema.format,
				false,
				schema.description,
			);
		}
	}

	private canParseOneOfAsEnum(schema: OpenAPIV3_1.SchemaObject): boolean {
		return (
			!!schema.oneOf?.length &&
			!!schema.oneOf.every(
				x =>
					!isOpenApiReferenceObject(x) &&
					Object.prototype.hasOwnProperty.call(x, 'const'),
			)
		);
	}

	private parseOneOfAsEnum(schema: OpenAPIV3_1.SchemaObject, data?: IParseSchemaData): Model {
		if (schema.type !== 'string' && schema.type !== 'integer' && schema.type !== 'number') {
			schemaWarning(new DefaultError('Unsupported enum type', [data?.name]));

			return new UnknownModel();
		}

		const entries = this.getOneOfEnumEntries(schema.oneOf ?? []);

		const enumDef = new EnumModel(
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
	): EnumEntry[] {
		const entries: EnumEntry[] = [];

		for (const rawEntry of rawEntries) {
			if (isOpenApiReferenceObject(rawEntry)) {
				schemaWarning(new UnresolvedReferenceError(rawEntry.$ref));

				continue;
			}

			const value = (rawEntry as Record<string, unknown>)['const'];

			const entry = new EnumEntry(
				rawEntry.title ?? CommonParserSchemaService.getDefaultEntryNameByValue(value),
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
