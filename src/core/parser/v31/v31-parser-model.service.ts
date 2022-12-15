import { OpenAPIV3_1 } from 'openapi-types';
import {
	ExtendedModelDef,
	ExtendedType,
} from '../../entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../entities/schema-entities/null-model-def.model';
import { SimpleModelDef } from '../../entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParseSchemaData,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	schemaWarning,
	UnresolvedReferenceError,
} from '../parser.model';

export class V31ParserModelService {
	constructor(
		private readonly repository: ParserRepositoryService<
			OpenAPIV3_1.SchemaObject,
			SchemaEntity
		>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	// TODO REFACTOR COMPLEXITY (+COMMON PARSER 2-3-31)
	parse(schema: OpenAPIV3_1.SchemaObject, data?: IParseSchemaData): ModelDef {
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
			if (Array.isArray(schema.type)) {
				const defs: ModelDef[] = [];

				for (const type of schema.type) {
					const def =
						type === 'null'
							? new NullModelDef()
							: new SimpleModelDef(type, { format: schema.format });

					defs.push(def);
				}

				modelDef = new ExtendedModelDef('or', defs);
			} else if (schema.type !== 'null') {
				// TODO take descriptions
				modelDef = new SimpleModelDef(schema.type, { format: schema.format });
			} else {
				modelDef = new NullModelDef();
			}
		} else {
			modelDef = new UnknownModelDef();

			schemaWarning([data?.name], new Error('Unknown type.'));
		}

		return modelDef; // TODO refactor to return instantly
	}

	private getNameOrDefault(name?: string): string {
		return name ?? 'Unknown';
	}

	private parseCollection(
		type: ExtendedType,
		collection: (OpenAPIV3_1.SchemaObject | OpenAPIV3_1.ReferenceObject)[],
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
