import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import {
	IParseSchemaData,
	schemaWarning,
	TrivialError,
	UnresolvedReferenceError,
} from '../../../core/parser/parser.model';
import { IDocument } from '../../entities/document.model';
import { EnumDef } from '../../entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { isReferenceEntity, SchemaEntity } from '../../entities/shared.model';
import { CommonParserService } from '../common/common-parser.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService, isOpenApiReferenceObject } from '../parser.model';
import { V3ParserPathService } from './v3-parser-path.service';
import { V3ParserSchemaService } from './v3-parser-schema.service';

export class V3ParserService implements IParserService<OpenAPIV3.Document> {
	private readonly repository = new ParserRepositoryService<
		OpenAPIV3.SchemaObject,
		SchemaEntity
	>();

	private readonly modelService = new V3ParserSchemaService(this.repository, (schema, data) =>
		this.parseSchemaEntity(schema, data),
	);

	private readonly pathService = new V3ParserPathService(this.repository, (schema, data) =>
		this.parseSchemaEntity(schema, data),
	);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV3.Document): IDocument {
		const schemas = doc.components?.schemas;

		if (schemas) {
			this.parseSchemas(schemas);
		}

		const paths = this.parsePaths(doc.paths);

		const enums = this.repository.getEntities([EnumDef]);
		const models = this.repository.getEntities([ObjectModelDef]);

		return { enums, models, paths };
	}

	private parsePaths(docPaths: OpenAPIV3.PathsObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries(docPaths)) {
			if (path && CommonParserService.isNecessaryToGenerate(pattern)) {
				const newPaths = this.pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		return paths;
	}

	private parseSchemas(
		schemas: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>,
	): void {
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
		schema: OpenAPIV3.SchemaObject,
		data?: IParseSchemaData,
	): SchemaEntity {
		if (this.repository.hasSource(schema)) {
			return this.repository.getEntity(schema);
		}

		return this.modelService.parse(schema, data);
	}
}
