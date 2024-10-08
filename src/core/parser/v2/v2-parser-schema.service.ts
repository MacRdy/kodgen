import { OpenAPIV2 } from 'openapi-types';
import { UnknownModel } from '../../entities/model/unknown-model.model';
import { Model } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ICommonParserSchemaService } from '../common/common-parser.model';
import {
	IParseSchemaData,
	ParseSchemaEntityFn,
	schemaWarning,
	UnknownTypeError,
} from '../parser.model';

export class V2ParserSchemaService implements ICommonParserSchemaService<OpenAPIV2.SchemaObject> {
	constructor(private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject>) {}

	parse(schema: OpenAPIV2.SchemaObject, data?: IParseSchemaData): Model {
		if (schema.enum) {
			return CommonParserSchemaService.parseEnum(schema, data, this.nullable(schema));
		} else if (schema.type === 'object') {
			return CommonParserSchemaService.parseObject(
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
				schema.description,
			);
		}

		schemaWarning(new UnknownTypeError([data?.name]));

		return new UnknownModel();
	}

	private nullable(schema: OpenAPIV2.SchemaObject): boolean {
		return !!schema['x-nullable'];
	}
}
