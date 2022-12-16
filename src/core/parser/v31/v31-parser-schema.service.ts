import { OpenAPIV3_1 } from 'openapi-types';
import { ExtendedModelDef } from '../../entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../entities/schema-entities/null-model-def.model';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ICommonParserSchemaService } from '../common/common-parser.model';
import {
	IParseSchemaData,
	ParseSchemaEntityFn,
	schemaWarning,
	UnknownTypeError,
} from '../parser.model';

export class V31ParserSchemaService
	implements ICommonParserSchemaService<OpenAPIV3_1.SchemaObject>
{
	constructor(
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	parse(schema: OpenAPIV3_1.SchemaObject, data?: IParseSchemaData): SchemaEntity {
		if (schema.enum) {
			return CommonParserSchemaService.parseEnum(schema, data);
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
		} else if (schema.type !== 'null') {
			return CommonParserSchemaService.parseSimple(schema.type, schema.format);
		} else {
			return new NullModelDef();
		}
	}
}
