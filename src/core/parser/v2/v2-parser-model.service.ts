import { OpenAPIV2 } from 'openapi-types';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { UnknownModelDef } from '../../../core/entities/schema-entities/unknown-model-def.model';
import { SimpleModelDef } from '../../entities/schema-entities/simple-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParseSchemaData, ParseSchemaEntityFn, schemaWarning } from '../parser.model';

export class V2ParserModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject>,
	) {}

	parse(schema: OpenAPIV2.SchemaObject, data?: IParseSchemaData): ModelDef {
		let modelDef: ModelDef;

		if (schema.type === 'object') {
			modelDef = CommonParserSchemaService.parseObject(
				this.repository,
				this.parseSchemaEntity,
				schema,
				data,
			);
		} else if (schema.type === 'array') {
			modelDef = CommonParserSchemaService.parseArray(this.parseSchemaEntity, schema, data);
		} else if (schema.type && !Array.isArray(schema.type)) {
			modelDef = new SimpleModelDef(schema.type, { format: schema.format });
		} else {
			modelDef = new UnknownModelDef();

			schemaWarning([data?.name], new Error('Unknown type.'));
		}

		if (schema.nullable) {
			modelDef = new ExtendedModelDef('or', [modelDef, new NullModelDef()]);
		}

		return modelDef;
	}

	private getNameOrDefault(name?: string): string {
		return name ?? 'Unknown';
	}
}
