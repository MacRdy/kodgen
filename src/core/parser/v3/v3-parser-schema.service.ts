import { OpenAPIV3 } from 'openapi-types';
import { ExtendedModelDef } from '../../entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../entities/schema-entities/null-model-def.model';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParseSchemaData,
	ParseSchemaEntityFn,
	schemaWarning,
	UnknownTypeError,
} from '../parser.model';

export class V3ParserSchemaService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject>,
	) {}

	parse(schema: OpenAPIV3.SchemaObject, data?: IParseSchemaData): SchemaEntity {
		let modelDef: ModelDef;

		if (schema.enum) {
			modelDef = CommonParserSchemaService.parseEnum(this.repository, schema, data);
		} else if (schema.allOf?.length) {
			modelDef = CommonParserSchemaService.parseCombination(
				this.repository,
				this.parseSchemaEntity,
				'allOf',
				schema,
				data,
			);
		} else if (schema.oneOf?.length) {
			modelDef = CommonParserSchemaService.parseCombination(
				this.repository,
				this.parseSchemaEntity,
				'oneOf',
				schema,
				data,
			);
		} else if (schema.anyOf?.length) {
			modelDef = CommonParserSchemaService.parseCombination(
				this.repository,
				this.parseSchemaEntity,
				'anyOf',
				schema,
				data,
			);
		} else if (schema.type === 'object') {
			modelDef = CommonParserSchemaService.parseObject(
				this.repository,
				this.parseSchemaEntity,
				schema,
				data,
			);
		} else if (schema.type === 'array') {
			modelDef = CommonParserSchemaService.parseArray(this.parseSchemaEntity, schema, data);
		} else if (schema.type) {
			modelDef = CommonParserSchemaService.parseSimple(schema.type, schema.format);
		} else {
			modelDef = new UnknownModelDef();
			schemaWarning([data?.name], new UnknownTypeError());
		}

		if (!(modelDef instanceof UnknownModelDef) && schema.nullable) {
			modelDef = new ExtendedModelDef('or', [modelDef, new NullModelDef()]);
		}

		return modelDef;
	}
}
