import { IServer } from 'core/entities/schema-entities/server.model';
import { ITag } from 'core/entities/schema-entities/tag.model';
import pathLib from 'path';
import { EnumDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import {
	PathDef,
	PathRequestBody,
	PathResponse,
} from '../../../core/entities/schema-entities/path-def.model';
import { IImportRegistryEntry } from '../../../core/import-registry/import-registry.model';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { Printer } from '../../../core/printer/printer';
import { IGeneratorFile } from '../../generator.model';
import { IJSDocConfig, IJSDocConfigParam } from '../jsdoc/jsdoc.model';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGeneratorConfig,
	ITsPath,
	ITsPathBody,
	ITsPathRequest,
	ITsPathResponse,
} from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';

export class TypescriptGeneratorPathService {
	private readonly jsonMediaRe = /^application\/json$/i;

	private readonly successResponseCodeRe = /^2/;
	private readonly defaultResponseCodeRe = /^default$/i;

	constructor(
		private readonly modelService: TypescriptGeneratorModelService,
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
		private readonly config: ITsGeneratorConfig,
	) {}

	generate(paths: PathDef[], servers: IServer[], tags: ITag[]): IGeneratorFile[] {
		const baseUrl = servers[0]?.url;

		const files: IGeneratorFile[] = [];

		const pathsToGenerate: Record<string, PathDef[]> = {};
		const commonPaths: PathDef[] = [];

		for (const path of paths) {
			if (path.tags?.length) {
				for (const tag of path.tags) {
					const tagPaths = pathsToGenerate[tag] ?? [];

					pathsToGenerate[tag] = [...tagPaths, path];
				}
			} else {
				commonPaths.push(path);
			}
		}

		for (const [name, p] of Object.entries(pathsToGenerate)) {
			Printer.verbose(`Creating service for '${name}'`);

			const entityName = this.namingService.generateUniqueServiceName(name);

			const file = this.getSpecificServiceFile(
				entityName,
				pathLib.posix.join(
					this.config.pathDir,
					this.config.pathFileNameResolver(entityName),
				),
				p,
				baseUrl,
				tags.find(x => x.name === name)?.description,
			);

			files.push(file);
		}

		if (commonPaths.length) {
			Printer.verbose(`Creating common service`);

			const file = this.getSpecificServiceFile(
				this.namingService.generateServiceName('common'),
				this.config.pathFileNameResolver('common'),
				commonPaths,
				baseUrl,
			);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(
		name: string,
		filePath: string,
		pathDefs: PathDef[],
		baseUrl?: string,
		description?: string,
	): IGeneratorFile {
		const paths: ITsPath[] = [];

		for (const path of pathDefs) {
			Printer.verbose(`Adding path ${path.urlPattern}`);

			const pathName = this.namingService.generateUniqueMethodName(name, [
				path.urlPattern,
				path.method,
			]);

			const pathModel: ITsPath = {
				name: pathName,
				urlPattern: path.urlPattern,
				method: path.method,
				request: this.getRequest(path),
				response: this.getResponse(path),
				deprecated: path.deprecated,
				summaries: path.summaries,
				descriptions: path.descriptions,
				extensions: path.extensions,
				security: path.security,
			};

			paths.push(pathModel);
		}

		return {
			path: filePath,
			template: 'service',
			templateData: {
				name,
				description,
				baseUrl,
				paths,
				jsdoc: new JSDocService(),
				toJSDocConfig: (
					path: ITsPath,
					queryParametersVarName: string,
					bodyVarName: string,
					responseTypeName?: string,
				): IJSDocConfig =>
					this.toJSDocConfig(path, queryParametersVarName, bodyVarName, responseTypeName),
				getImportEntries: () => this.getImportEntries(paths, filePath),
				parametrizeUrlPattern: (urlPattern: string) =>
					urlPattern.replace(
						/{([^}]+)(?=})}/g,
						(_, capture: string) => '${' + capture + '}',
					),
			},
		};
	}

	private toJSDocConfig(
		path: ITsPath,
		queryParametersVarName: string,
		bodyVarName: string,
		responseTypeName?: string,
	): IJSDocConfig {
		const params: IJSDocConfigParam[] = [];

		if (path.request.pathParametersType) {
			for (const param of path.request.pathParametersType.properties) {
				params.push({
					name: param.name,
					type: param.type,
					optional: !param.required,
					description: param.description,
				});
			}
		}

		if (path.request.queryParametersType) {
			params.push({
				name: queryParametersVarName,
				type: path.request.queryParametersType.name,
				description: 'Request query parameters',
			});
		}

		if (path.request.body) {
			params.push({
				name: bodyVarName,
				type: path.request.body.typeName,
				description: 'Request body',
			});
		}

		return {
			params,
			deprecated: path.deprecated,
			summary: path.summaries,
			description: path.descriptions,
			returns: {
				type: responseTypeName,
				description: path.response.description,
			},
		};
	}

	private getRequest(path: PathDef): ITsPathRequest {
		const pathParametersType =
			path.requestPathParameters &&
			this.storage.get(path.requestPathParameters)?.generatedModel;

		const queryParametersType =
			path.requestQueryParameters &&
			this.storage.get(path.requestQueryParameters)?.generatedModel;

		const pathRequestBody = this.getPathRequestBody(path);

		const dependencies: string[] = [];

		if (pathParametersType) {
			for (const prop of pathParametersType.properties) {
				dependencies.push(...prop.dependencies);
			}
		}

		if (queryParametersType) {
			dependencies.push(queryParametersType.name);
		}

		let body: ITsPathBody | undefined;

		if (pathRequestBody) {
			const bodyDependencies = this.modelService.resolveDependencies(pathRequestBody.content);

			dependencies.push(...bodyDependencies);

			body = {
				typeName: this.modelService.resolveType(pathRequestBody.content),
				media: pathRequestBody.media,
			};
		}

		return {
			pathParametersType,
			queryParametersType,
			queryParametersMapping:
				path.requestQueryParameters &&
				this.storage.get(path.requestQueryParameters)?.mapping,
			body,
			dependencies,
		};
	}

	private getPathRequestBody(path: PathDef): PathRequestBody | undefined {
		let body: PathRequestBody | undefined;

		if (path.requestBodies && path.requestBodies.length > 1) {
			body = path.requestBodies.find(x => new RegExp(this.jsonMediaRe).test(x.media));

			if (body) {
				Printer.verbose(`Multiple request bodies found. Take '${body.media}'`);
			}
		}

		if (!body) {
			body = path.requestBodies?.[0];

			if (body && path.requestBodies && path.requestBodies.length > 1) {
				Printer.verbose(`Multiple request bodies found. Take first (${body.media})`);
			}
		}

		return body;
	}

	private getResponse(path: PathDef): ITsPathResponse {
		let response = this.getMostRelatedResponse(
			path.responses ?? [],
			this.successResponseCodeRe,
		);

		if (!response) {
			response = this.getMostRelatedResponse(
				path.responses ?? [],
				this.defaultResponseCodeRe,
			);
		}

		const responseType = response?.content;

		if (!responseType) {
			return { typeName: 'void', dependencies: [] };
		}

		const dependencies: string[] = [];

		if (response) {
			const responseDependencies = this.modelService.resolveDependencies(response.content);

			dependencies.push(...responseDependencies);
		}

		return {
			dependencies,
			typeName: this.modelService.resolveType(responseType),
			media: response?.media,
			description:
				responseType instanceof EnumDef || responseType instanceof ObjectModelDef
					? responseType.description
					: undefined,
		};
	}

	private getMostRelatedResponse(list: PathResponse[], media: RegExp): PathResponse | undefined {
		let response: PathResponse | undefined;

		if (list.length > 1) {
			response = list.find(
				x => new RegExp(media).test(x.code) && new RegExp(this.jsonMediaRe).test(x.media),
			);

			if (response) {
				Printer.verbose(
					`Multiple responses found. Take '${response.media}' (${response.code})`,
				);
			}
		}

		if (!response) {
			response = list.find(x => new RegExp(media).test(x.code));

			if (response && list.length > 1) {
				Printer.verbose(`Multiple responses found. Take first (${response.media})`);
			}
		}

		return response;
	}

	private getImportEntries(paths: ITsPath[], currentFilePath: string): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			dependencies.push(...p.request.dependencies, ...p.response.dependencies);
		}

		return this.importRegistry.getImportEntries(dependencies, currentFilePath);
	}
}
