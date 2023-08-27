import { NamedModel } from '../../../core/entities/named.model';
import { getDereferenceResolvedValueOrDefault } from '../../dereference/dereference.model';
import { IDocument } from '../../entities/document.model';
import { Contact, Info, License } from '../../entities/info.model';
import { Path } from '../../entities/path.model';
import { Server } from '../../entities/server.model';
import { Model } from '../../entities/shared.model';
import { Tag } from '../../entities/tag.model';
import { Printer } from '../../printer/printer';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	IParseSchemaData,
	UnresolvedReferenceError,
	isOpenApiReferenceObject,
	schemaWarning,
} from '../parser.model';
import {
	ICommonParserConfig,
	ICommonParserPathService,
	ICommonParserSchemaService,
	OpenApiInfoObject,
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

	static parse<
		T1 extends OpenApiSchemaObject,
		T2 extends Record<string, T3 | undefined>,
		T3 extends OpenApiPathsItemObject,
	>(
		schemaService: ICommonParserSchemaService<T1>,
		pathService: ICommonParserPathService<T3>,
		info?: OpenApiInfoObject,
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

		return {
			info: this.parseInfo(info),
			models: repository.getAllEntities(),
			paths,
			servers: this.parseServers(servers),
			tags: this.parseTags(tags),
		};
	}

	private static parseInfo(rawInfo?: OpenApiInfoObject): Info {
		const info = new Info(
			rawInfo?.title,
			rawInfo?.version,
			rawInfo?.summary,
			rawInfo?.description,
			rawInfo?.termsOfService,
		);

		if (rawInfo?.contact) {
			info.contact = new Contact(
				rawInfo.contact.name,
				rawInfo.contact.url,
				rawInfo.contact.email,
			);
		}

		if (rawInfo?.license) {
			info.license = new License(
				rawInfo.license.name,
				rawInfo.license.identifier,
				rawInfo.license.url,
			);
		}

		return info;
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
	): Model {
		const repository = ParserRepositoryService.getInstance<T>();

		const originalSchema = getDereferenceResolvedValueOrDefault<T>(schema);

		if (repository.hasSource(originalSchema)) {
			return repository.getEntity(originalSchema);
		}

		return schemaService.parse(originalSchema, data);
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
				schemaWarning(new UnresolvedReferenceError(schema.$ref));
				continue;
			}

			if (repository.hasSource(schema)) {
				const entity = repository.getEntity(schema);

				if (entity instanceof NamedModel) {
					entity.name = name;
					entity.originalName = true;
				}

				continue;
			}

			this.parseSchemaEntity(schemaService, schema, { name });
		}
	}

	private static parsePaths<
		T1 extends Record<string, T2 | undefined>,
		T2 extends OpenApiPathsItemObject,
	>(
		pathService: ICommonParserPathService<T2>,
		docPaths?: T1,
		config?: ICommonParserConfig,
	): Path[] {
		if (!docPaths) {
			return [];
		}

		const paths: Path[] = [];

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
