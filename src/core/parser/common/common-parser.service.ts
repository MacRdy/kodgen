import { Config } from '../../../core/config/config';
import { IDocument } from '../../../core/entities/document.model';
import { EnumDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { PathDef } from '../../../core/entities/schema-entities/path-def.model';
import { isReferenceEntity, SchemaEntity } from '../../../core/entities/shared.model';
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
	ICommonParserPathService,
	ICommonParserSchemaService,
	OpenApiPathsItemObject,
	OpenApiReferenceObject,
	OpenApiSchemaObject,
} from './common-parser.model';

export class CommonParserService {
	static isNecessaryToGenerate(pattern: string): boolean {
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

	static selectEntities<T extends SchemaEntity>(entities: SchemaEntity[], type: Type<T>): T[] {
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
	): IDocument {
		const repository = ParserRepositoryService.getInstance<T1>();

		if (schemas) {
			this.parseSchemas(schemaService, schemas);
		}

		const paths = this.parsePaths<Record<string, T3 | undefined>, T3>(pathService, docPaths);

		const entities = repository.getAllEntities();

		return {
			enums: CommonParserService.selectEntities(entities, EnumDef),
			models: CommonParserService.selectEntities(entities, ObjectModelDef),
			paths,
		};
	}

	static parseSchemaEntity<T extends OpenApiSchemaObject>(
		schemaService: ICommonParserSchemaService<T>,
		schema: T,
		data?: IParseSchemaData,
	): SchemaEntity {
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

				if (isReferenceEntity(entity)) {
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
	>(pathService: ICommonParserPathService<T2>, docPaths?: T1): PathDef[] {
		if (!docPaths) {
			return [];
		}

		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries<T2 | undefined>(docPaths)) {
			if (path && CommonParserService.isNecessaryToGenerate(pattern)) {
				Printer.verbose(`Parse path '${pattern}'`);

				const newPaths = pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		return paths;
	}
}
