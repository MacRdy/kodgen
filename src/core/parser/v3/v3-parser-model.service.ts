import { OpenAPIV3 } from 'openapi-types';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import {
	IParseSchemaData,
	ParseSchemaEntityFn,
	TrivialError,
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
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, isOpenApiReferenceObject } from '../parser.model';

export class V3ParserModelService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject>,
	) {}

	parse(schema: OpenAPIV3.SchemaObject, data?: IParseSchemaData): ModelDef {
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
			const objectName = this.getNameOrDefault(data?.name);

			const obj = new ObjectModelDef(objectName, {
				deprecated: schema.deprecated,
				description: schema.description,
				origin: data?.origin,
				originalName: data?.originalName,
				extensions: getExtensions(schema),
			});

			modelDef = obj;
			this.repository.addEntity(modelDef, schema);

			const properties: Property[] = [];

			for (const [propName, propSchema] of Object.entries(schema.properties ?? [])) {
				if (isOpenApiReferenceObject(propSchema)) {
					throw new UnresolvedReferenceError();
				}

				const propDef = this.parseSchemaEntity(propSchema, {
					name: mergeParts(objectName, propName),
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

			const entity = this.parseSchemaEntity(schema.items, {
				name: mergeParts(this.getNameOrDefault(data?.name), 'Item'),
				origin: data?.origin,
			});

			modelDef = new ArrayModelDef(entity);
		} else if (schema.type) {
			modelDef = new SimpleModelDef(schema.type, { format: schema.format });
		} else {
			throw new TrivialError('Unsupported model schema.');
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
