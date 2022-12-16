import { OpenAPIV2 } from 'openapi-types';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ICommonParserSchemaService } from '../common/common-parser.model';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParseSchemaData,
	ParseSchemaEntityFn,
	schemaWarning,
	UnknownTypeError,
} from '../parser.model';

export class V2ParserSchemaService implements ICommonParserSchemaService<OpenAPIV2.SchemaObject> {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV2.SchemaObject>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject>,
	) {}

	parse(schema: OpenAPIV2.SchemaObject, data?: IParseSchemaData): SchemaEntity {
		if (schema.enum) {
			return CommonParserSchemaService.parseEnum(
				this.repository,
				schema,
				data,
				this.nullable(schema),
			);
		} else if (schema.type === 'object') {
			return CommonParserSchemaService.parseObject(
				this.repository,
				this.parseSchemaEntity,
				schema,
				data,
				this.nullable(schema),
			);
		} else if (schema.type === 'array') {
			return CommonParserSchemaService.parseArray(
				this.parseSchemaEntity,
				schema,
				data,
				this.nullable(schema),
			);
		} else if (schema.type && !Array.isArray(schema.type)) {
			return CommonParserSchemaService.parseSimple(
				schema.type,
				schema.format,
				this.nullable(schema),
			);
		}

		schemaWarning([data?.name], new UnknownTypeError());

		return new UnknownModelDef();
	}

	private nullable(schema: OpenAPIV2.SchemaObject): boolean | undefined {
		return schema['x-nullable'];
	}
}
