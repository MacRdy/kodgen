import { OpenAPI, OpenAPIV3_1 } from 'openapi-types';
import { IDocument } from '../../entities/document.model';
import { EnumDef } from '../../entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { isReferenceEntity, SchemaEntity } from '../../entities/shared.model';
import { CommonParserService } from '../common/common-parser.service';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParserService,
	IParseSchemaData,
	isOpenApiReferenceObject,
	schemaWarning,
	TrivialError,
	UnresolvedReferenceError,
} from '../parser.model';
import { V31ParserPathService } from './v31-parser-path.service';
import { V31ParserSchemaService } from './v31-parser-schema.service';

export class V31ParserService implements IParserService<OpenAPIV3_1.Document> {
	private readonly repository = new ParserRepositoryService<
		OpenAPIV3_1.SchemaObject,
		SchemaEntity
	>();

	private readonly modelService = new V31ParserSchemaService(this.repository, (schema, data) =>
		this.parseSchemaEntity(schema, data),
	);

	private readonly pathService = new V31ParserPathService(this.repository, (schema, data) =>
		this.parseSchemaEntity(schema, data),
	);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3_1.Document;

			return v3Doc.openapi === '3.1.0';
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV3_1.Document): IDocument {
		const schemas = doc.components?.schemas;

		if (schemas) {
			this.parseSchemas(schemas);
		}

		const paths = this.parsePaths(doc.paths);

		const entities = this.repository.getAllEntities();

		return {
			enums: CommonParserService.selectEntities(entities, EnumDef),
			models: CommonParserService.selectEntities(entities, ObjectModelDef),
			paths,
		};
	}

	private parsePaths(docPaths?: OpenAPIV3_1.PathsObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries(docPaths ?? {})) {
			if (path && CommonParserService.isNecessaryToGenerate(pattern)) {
				const newPaths = this.pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		return paths;
	}

	private parseSchemas(schemas: Record<string, OpenAPIV3_1.SchemaObject>): void {
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
				this.parseSchemaEntity(schema, { name, originalName: true });
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
		schema: OpenAPIV3_1.SchemaObject,
		data?: IParseSchemaData,
	): SchemaEntity {
		if (this.repository.hasSource(schema)) {
			return this.repository.getEntity(schema);
		}

		return this.modelService.parse(schema, data);
	}
}
