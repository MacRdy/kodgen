import { OpenAPIV3 } from 'openapi-types';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from '../../../core/entities/schema-entities/unknown-model-def.model';
import {
	IParseSchemaData,
	ParseSchemaEntityFn,
	schemaWarning,
	UnresolvedReferenceError,
} from '../../../core/parser/parser.model';
import {
	ExtendedModelDef,
	ExtendedType,
} from '../../entities/schema-entities/extended-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { isOpenApiReferenceObject } from '../parser.model';

export class V3ParserModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject>,
	) {}

	// TODO REFACTOR COMPLEXITY (+COMMON PARSER 2-3-31)
	parse(schema: OpenAPIV3.SchemaObject, data?: IParseSchemaData): ModelDef {
		let modelDef: ModelDef;

		if (schema.allOf?.length) {
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
			modelDef = new SimpleModelDef(schema.type, { format: schema.format });
		} else {
			modelDef = new UnknownModelDef();

			schemaWarning([data?.name], new Error('Unknown type.'));
		}

		if (schema.nullable) {
			modelDef = new ExtendedModelDef('or', [modelDef, new NullModelDef()]);
		}

		return modelDef; // TODO refactor to return instantly
	}

	private getNameOrDefault(name?: string): string {
		return name ?? 'Unknown';
	}

	private parseCollection(
		type: ExtendedType,
		collection: (OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject)[],
		data?: IParseSchemaData,
	): ModelDef {
		const def: ModelDef[] = [];

		for (const schema of collection) {
			if (isOpenApiReferenceObject(schema)) {
				throw new UnresolvedReferenceError();
			}

			const modelDef = this.parseSchemaEntity(schema, data);

			def.push(modelDef);
		}

		return new ExtendedModelDef(type, def);
	}
}
