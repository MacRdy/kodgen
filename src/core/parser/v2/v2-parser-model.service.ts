import { OpenAPIV2 } from 'openapi-types';
import { UnknownModelDef } from '../../../core/entities/schema-entities/unknown-model-def.model';
import { Printer } from '../../../core/print/printer';
import { ArrayModelDef } from '../../entities/schema-entities/array-model-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { SimpleModelDef } from '../../entities/schema-entities/simple-model-def.model';
import { ModelDef, SchemaEntity } from '../../entities/shared.model';
import { mergeParts } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	getExtensions,
	IParseSchemaData,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	TrivialError,
	UnresolvedReferenceError,
} from '../parser.model';

export class V2ParserModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject>,
	) {}

	parse(schema: OpenAPIV2.SchemaObject, data?: IParseSchemaData): ModelDef {
		let modelDef: ModelDef;

		if (schema.type === 'object') {
			let additionalProperties: SchemaEntity | undefined;

			if (schema.additionalProperties === true) {
				additionalProperties = new UnknownModelDef();
			} else if (
				schema.additionalProperties &&
				typeof schema.additionalProperties !== 'boolean'
			) {
				try {
					additionalProperties = this.parseSchemaEntity(
						schema.additionalProperties as OpenAPIV2.SchemaObject,
					);
				} catch (e) {
					const schemaName = data?.name ? `schema '${data.name}' -> ` : '';

					Printer.warn(
						`Warning (${schemaName}additionalProperties): Unsupported schema.`,
					);
				}
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
				if (isOpenApiReferenceObject(propSchema)) {
					throw new UnresolvedReferenceError();
				}

				const propDef = this.parseSchemaEntity(propSchema, {
					name: mergeParts(this.getNameOrDefault(data?.name), propName),
					origin: data?.origin,
				});

				const prop = new Property(propName, propDef, {
					required: !!schema.required?.find(x => x === propName),
					nullable: propSchema.nullable,
					deprecated: propSchema.deprecated,
					readonly: propSchema.readOnly,
					writeonly: propSchema.writeOnly,
					description: propSchema.description,
					extensions: getExtensions(propSchema),
				});

				properties.push(prop);
			}

			obj.properties = properties;
		} else if (schema.type === 'array') {
			if (isOpenApiReferenceObject(schema.items)) {
				throw new UnresolvedReferenceError();
			}

			if (!schema.items) {
				throw new Error('Schema not found.');
			}

			const entity = this.parseSchemaEntity(schema.items, {
				name: mergeParts(this.getNameOrDefault(data?.name), 'Item'),
				origin: data?.origin,
			});

			modelDef = new ArrayModelDef(entity);
		} else if (schema.type && !Array.isArray(schema.type)) {
			modelDef = new SimpleModelDef(schema.type, { format: schema.format });
		} else {
			throw new TrivialError(`Unsupported model schema.`);
		}

		return modelDef;
	}

	private getNameOrDefault(name?: string): string {
		return name ?? 'Unknown';
	}
}
