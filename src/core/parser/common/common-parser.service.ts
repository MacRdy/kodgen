import { IDocument } from '../../../core/entities/document.model';
import { EnumModelDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { PathDef } from '../../../core/entities/schema-entities/path-def.model';
import { Server } from '../../../core/entities/schema-entities/server.model';
import { Tag } from '../../../core/entities/schema-entities/tag.model';
import { isReferenceModel, ModelDef } from '../../../core/entities/shared.model';
import { Printer } from '../../../core/printer/printer';
import { Type } from '../../../core/utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParseSchemaData,
	isOpenApiReferenceObject,
	schemaWarning,
	TrivialError,
	UnresolvedReferenceError,
} from '../parser.model';
import {
	ICommonParserConfig,
	ICommonParserPathService,
	ICommonParserSchemaService,
	OpenApiPathsItemObject,
	OpenApiReferenceObject,
	OpenApiSchemaObject,
	OpenApiTagObject,
	OpenApiV3xServerObject,
} from './common-parser.model';

export class CommonParserService {
	private static isNecessaryToGenerate(
		pattern: string,
		includePaths?: readonly string[],
		excludePaths?: readonly string[],
	): boolean {
		if (includePaths) {
			return includePaths.some(re => new RegExp(re).test(pattern));
		}

		if (excludePaths) {
			return !excludePaths.some(re => new RegExp(re).test(pattern));
		}

		return true;
	}

	static selectEntities<T extends ModelDef>(entities: ModelDef[], type: Type<T>): T[] {
		const selected: Set<T> = new Set<T>();

		for (const entity of entities) {
			if (entity instanceof type) {
				selected.add(entity);
			} else if (entity instanceof ExtendedModelDef) {
				for (const defEntity of this.selectEntities(entity.def, type)) {
					selected.add(defEntity);
				}
			}
		}

		return [...selected.values()];
	}

	static parse<
		T1 extends OpenApiSchemaObject,
		T2 extends Record<string, T3 | undefined>,
		T3 extends OpenApiPathsItemObject,
	>(
		schemaService: ICommonParserSchemaService<T1>,
		pathService: ICommonParserPathService<T3>,
		schemas?: Record<string, T1 | OpenApiReferenceObject>,
		docPaths?: T2,
		servers?: OpenApiV3xServerObject[],
		tags?: OpenApiTagObject[],
		config?: ICommonParserConfig,
	): IDocument {
		const repository = ParserRepositoryService.getInstance<T1>();

		if (schemas) {
			this.parseSchemas(schemaService, schemas);
		}

		const paths = this.parsePaths<Record<string, T3 | undefined>, T3>(
			pathService,
			docPaths,
			config,
		);

		const entities = repository.getAllEntities();

		return {
			enums: this.selectEntities(entities, EnumModelDef),
			models: this.selectEntities(entities, ObjectModelDef),
			paths,
			servers: this.parseServers(servers),
			tags: this.parseTags(tags),
		};
	}

	private static parseServers(servers?: OpenApiV3xServerObject[]): Server[] {
		return servers?.map<Server>(x => new Server(x.url, x.description)) ?? [];
	}

	private static parseTags(tags?: OpenApiTagObject[]): Tag[] {
		return tags?.map<Tag>(x => new Tag(x.name, x.description)) ?? [];
	}

	static parseSchemaEntity<T extends OpenApiSchemaObject>(
		schemaService: ICommonParserSchemaService<T>,
		schema: T,
		data?: IParseSchemaData,
	): ModelDef {
		const repository = ParserRepositoryService.getInstance<T>();

		if (repository.hasSource(schema)) {
			return repository.getEntity(schema);
		}

		return schemaService.parse(schema, data);
	}

	private static parseSchemas<T extends OpenApiSchemaObject>(
		schemaService: ICommonParserSchemaService<T>,
		schemas?: Record<string, T | OpenApiReferenceObject>,
	): void {
		const repository = ParserRepositoryService.getInstance<T>();

		if (!schemas) {
			return;
		}

		for (const [name, schema] of Object.entries(schemas)) {
			Printer.verbose(`Parse schema '${name}'`);

			if (isOpenApiReferenceObject(schema)) {
				throw new UnresolvedReferenceError(schema.$ref);
			}

			if (repository.hasSource(schema)) {
				const entity = repository.getEntity(schema);

				if (isReferenceModel(entity)) {
					entity.name = name;
					entity.originalName = true;
				}

				continue;
			}

			try {
				this.parseSchemaEntity(schemaService, schema, { name });
			} catch (e: unknown) {
				if (e instanceof TrivialError) {
					schemaWarning([name], e);
				} else {
					throw e;
				}
			}
		}
	}

	private static parsePaths<
		T1 extends Record<string, T2 | undefined>,
		T2 extends OpenApiPathsItemObject,
	>(
		pathService: ICommonParserPathService<T2>,
		docPaths?: T1,
		config?: ICommonParserConfig,
	): PathDef[] {
		if (!docPaths) {
			return [];
		}

		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries<T2 | undefined>(docPaths)) {
			if (
				path &&
				this.isNecessaryToGenerate(pattern, config?.includePaths, config?.excludePaths)
			) {
				Printer.verbose(`Parse path '${pattern}'`);

				const newPaths = pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		return paths;
	}
}
