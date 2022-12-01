import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { TrivialError, UnresolvedReferenceError } from '../../../core/parser/parser.model';
import { Printer } from '../../../core/print/printer';
import { Config } from '../../config/config';
import { IDocument } from '../../entities/document.model';
import { EnumDef } from '../../entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { isReferenceEntity, SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService } from '../parser.model';
import { V3ParserEnumService } from './v3-parser-enum.service';
import { V3ParserModelService } from './v3-parser-model.service';
import { V3ParserPathService } from './v3-parser-path.service';
import { isOpenApiV3ReferenceObject } from './v3-parser.model';

export class V3ParserService implements IParserService<OpenAPIV3.Document> {
	private readonly repository = new ParserRepositoryService<
		OpenAPIV3.SchemaObject,
		SchemaEntity
	>();

	private readonly enumService = new V3ParserEnumService(this.repository);

	private readonly modelService = new V3ParserModelService(this.repository, (schema, name) =>
		this.parseSchemaEntity(schema, name),
	);

	private readonly pathService = new V3ParserPathService(this.repository, (schema, name) =>
		this.parseSchemaEntity(schema, name),
	);

	private readonly config = Config.get();

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
			if (path && this.isNecessaryToGenerate(pattern)) {
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
			if (isOpenApiV3ReferenceObject(schema)) {
				throw new UnresolvedReferenceError();
			}

			if (this.repository.hasSource(schema)) {
				const entity = this.repository.getEntity(schema);

				if (name && isReferenceEntity(entity)) {
					entity.name = name;
				}

				continue;
			}

			try {
				this.parseSchemaEntity(schema, name);
			} catch (e: unknown) {
				if (e instanceof TrivialError) {
					Printer.warn(`Warning (schema '${name}'): ${e.message}`);
				} else {
					throw e;
				}
			}
		}
	}

	private parseSchemaEntity(schema: OpenAPIV3.SchemaObject, name: string): SchemaEntity {
		if (this.repository.hasSource(schema)) {
			return this.repository.getEntity(schema);
		}

		if (name && this.enumService.isSupported(schema)) {
			return this.enumService.parse(schema, name);
		}

		return this.modelService.parse(schema, name);
	}

	private isNecessaryToGenerate(pattern: string): boolean {
		if (this.config.includePaths) {
			return this.config.includePaths.some(re => new RegExp(re).test(pattern));
		}

		if (this.config.excludePaths) {
			return !this.config.excludePaths.some(re => new RegExp(re).test(pattern));
		}

		return true;
	}
}
