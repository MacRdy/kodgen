import { OpenAPIV3 } from 'openapi-types';
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

export class V3ParserSchemaService implements ICommonParserSchemaService<OpenAPIV3.SchemaObject> {
	constructor(private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject>) {}

	parse(schema: OpenAPIV3.SchemaObject, data?: IParseSchemaData): Model {
		if (schema.enum) {
			return CommonParserSchemaService.parseEnum(schema, data, schema.nullable);
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
			return CommonParserSchemaService.parseObject(
				this.parseSchemaEntity,
				schema,
				data,
				schema.nullable,
			);
		} else if (schema.type === 'array') {
			return CommonParserSchemaService.parseArray(
				this.parseSchemaEntity,
				schema,
				data,
				schema.nullable,
			);
		} else if (schema.type) {
			return CommonParserSchemaService.parseSimple(
				schema.type,
				schema.format,
				schema.nullable,
			);
		}

		schemaWarning(new UnknownTypeError([data?.name]));

		return new UnknownModel();
	}
}
