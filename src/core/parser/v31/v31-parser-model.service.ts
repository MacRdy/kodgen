import { OpenAPIV3_1 } from 'openapi-types';
import { ArrayModelDef } from '../../entities/schema-entities/array-model-def.model';
import {
	ExtendedModelDef,
	ExtendedType,
} from '../../entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { SimpleModelDef } from '../../entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { mergeParts } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	getExtensions,
	IParseSchemaData,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	UnresolvedReferenceError,
	unsupportedSchemaWarning as schemaWarning,
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
			modelDef = this.parseCollection('allOf', schema.allOf, data);
			this.repository.addEntity(modelDef, schema);
		} else if (schema.oneOf?.length) {
			modelDef = this.parseCollection('oneOf', schema.oneOf, data);
			this.repository.addEntity(modelDef, schema);
		} else if (schema.anyOf?.length) {
			modelDef = this.parseCollection('anyOf', schema.anyOf, data);
			this.repository.addEntity(modelDef, schema);
		} else if (schema.type === 'object') {
			let additionalProperties: SchemaEntity | undefined;

			if (schema.additionalProperties) {
				if (typeof schema.additionalProperties !== 'boolean') {
					try {
						if (isOpenApiReferenceObject(schema.additionalProperties)) {
							throw new UnresolvedReferenceError();
						}

						additionalProperties = this.parseSchemaEntity(schema.additionalProperties);
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
			if (Array.isArray(schema.type)) {
				const defs: ModelDef[] = [];

				for (const type of schema.type) {
					const def =
						type === 'null'
							? new NullModelDef()
							: new SimpleModelDef(type, { format: schema.format });

					defs.push(def);
				}

				modelDef = new ExtendedModelDef('anyOf', defs);
			} else if (schema.type !== 'null') {
				// TODO take descriptions
				modelDef = new SimpleModelDef(schema.type, { format: schema.format });
			} else {
				modelDef = new NullModelDef();
			}
		} else {
			modelDef = new UnknownModelDef();

			schemaWarning([data?.name], new Error('Type not defined.'));
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
