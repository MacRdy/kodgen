import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import { Config } from '../../config/config';
import { IDocument } from '../../entities/document.model';
import { EnumDef } from '../../entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { isReferenceEntity, SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParserService,
	IParseSchemaData,
	isOpenApiReferenceObject,
	schemaWarning,
	TrivialError,
	UnresolvedReferenceError,
} from '../parser.model';
import { V2ParserPathService } from './v2-parser-path.service';
import { V2ParserSchemaService } from './v2-parser-schema.service';

export class V2ParserService implements IParserService<OpenAPIV2.Document> {
	private readonly repository = new ParserRepositoryService<
		OpenAPIV2.SchemaObject,
		SchemaEntity
	>();

	private readonly modelService = new V2ParserSchemaService(this.repository, (schema, data) =>
		this.parseSchemaEntity(schema, data),
	);

	private readonly pathService = new V2ParserPathService(this.repository, (schema, data) =>
		this.parseSchemaEntity(schema, data),
	);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV2.Document;

			return v3Doc.swagger === '2.0';
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV2.Document): IDocument {
		const schemas = doc.definitions;

		if (schemas) {
			this.parseSchemas(schemas);
		}

		const paths = this.parsePaths(doc.paths);

		const enums = this.repository.getEntities([EnumDef]);
		const models = this.repository.getEntities([ObjectModelDef]);

		return { enums, models, paths };
	}

	private parsePaths(docPaths: OpenAPIV2.PathsObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries(docPaths)) {
			if (path && this.isNecessaryToGenerate(pattern)) {
				const newPaths = this.pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		return paths;
	}

	private parseSchemas(schemas: OpenAPIV2.DefinitionsObject): void {
		for (const [name, schema] of Object.entries(schemas)) {
			if (isOpenApiReferenceObject(schema)) {
				throw new UnresolvedReferenceError();
			}

			if (this.repository.hasSource(schema)) {
				const entity = this.repository.getEntity(schema);

				if (isReferenceEntity(entity)) {
					entity.name = name;
					entity.originalName = true;
				}

				continue;
			}

			try {
				this.parseSchemaEntity(schema, { name });
			} catch (e: unknown) {
				if (e instanceof TrivialError) {
					schemaWarning([name], e);
				} else {
					throw e;
				}
			}
		}
	}

	private parseSchemaEntity(
		schema: OpenAPIV2.SchemaObject,
		data?: IParseSchemaData,
	): SchemaEntity {
		if (this.repository.hasSource(schema)) {
			return this.repository.getEntity(schema);
		}

		return this.modelService.parse(schema, data);
	}

	private isNecessaryToGenerate(pattern: string): boolean {
		const includePaths = Config.get().includePaths;

		if (includePaths) {
			return includePaths.some(re => new RegExp(re).test(pattern));
		}

		const excludePaths = Config.get().excludePaths;

		if (excludePaths) {
			return !excludePaths.some(re => new RegExp(re).test(pattern));
		}

		return true;
	}
}
