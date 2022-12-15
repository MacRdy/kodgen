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
import { mergeParts } from '../../../core/utils';
import { ArrayModelDef } from '../../entities/schema-entities/array-model-def.model';
import {
	ExtendedModelDef,
	ExtendedType,
} from '../../entities/schema-entities/extended-model-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, isOpenApiReferenceObject } from '../parser.model';

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
			let additionalProperties: SchemaEntity | undefined;

			if (schema.additionalProperties) {
				if (typeof schema.additionalProperties !== 'boolean') {
					try {
						if (isOpenApiReferenceObject(schema.additionalProperties)) {
							throw new UnresolvedReferenceError();
						}

						additionalProperties = this.parseSchemaEntity(schema.additionalProperties, {
							name: mergeParts(
								this.getNameOrDefault(data?.name),
								'additionalProperties',
							),
						});
					} catch (e) {
						schemaWarning([data?.name, 'additionalProperties'], e);
					}
				}

				additionalProperties ??= new UnknownModelDef();
			}

			const objectName = this.getNameOrDefault(data?.name);

			const obj = new ObjectModelDef(objectName, {
				deprecated: schema.deprecated,
				description: schema.description,
				origin: data?.origin,
				originalName: data?.originalName,
				extensions: getExtensions(schema),
				additionalProperties,
			});

			modelDef = obj;
			this.repository.addEntity(modelDef, schema);

			const properties: Property[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				try {
					if (isOpenApiReferenceObject(propSchema)) {
						throw new UnresolvedReferenceError();
					}

					const propDef = this.parseSchemaEntity(propSchema, {
						name: mergeParts(objectName, propName),
						origin: data?.origin,
					});

					const prop = new Property(propName, propDef, {
						required: !!schema.required?.find(x => x === propName),
						deprecated: propSchema.deprecated,
						readonly: propSchema.readOnly,
						writeonly: propSchema.writeOnly,
						description: propSchema.description,
						extensions: getExtensions(propSchema),
					});

					properties.push(prop);
				} catch (e) {
					schemaWarning([data?.name, propName], e);
				}
			}

			obj.properties = properties;
		} else if (schema.type === 'array') {
			try {
				if (isOpenApiReferenceObject(schema.items)) {
					throw new UnresolvedReferenceError();
				}

				const entity = this.parseSchemaEntity(schema.items, {
					name: mergeParts(this.getNameOrDefault(data?.name), 'Item'),
					origin: data?.origin,
				});

				modelDef = new ArrayModelDef(entity);
			} catch (e) {
				schemaWarning([data?.name], e);

				modelDef = new ArrayModelDef(new UnknownModelDef());
			}
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
