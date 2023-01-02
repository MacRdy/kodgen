import { ITag } from 'core/entities/schema-entities/tag.model';
import pathLib from 'path';
import { EnumDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { PathDef, PathRequestBody } from '../../../core/entities/schema-entities/path-def.model';
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
	ITsPathRequest,
	ITsPathResponse,
} from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';

export class TypescriptGeneratorPathService {
	private readonly multipartRe = /multipart\/form-data/gi;

	private readonly responseCodeRe: RegExp[] = [/^default$/gi, /^2/g];

	constructor(
		private readonly modelService: TypescriptGeneratorModelService,
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
		private readonly config: ITsGeneratorConfig,
	) {}

	generate(paths: PathDef[], tags: ITag[]): IGeneratorFile[] {
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
			);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(
		name: string,
		filePath: string,
		pathDefs: PathDef[],
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

		if (path.request.bodyTypeName) {
			params.push({
				name: bodyVarName,
				type: path.request.bodyTypeName,
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

		if (pathRequestBody) {
			const bodyDependencies = this.modelService.resolveDependencies(pathRequestBody.content);

			dependencies.push(...bodyDependencies);
		}

		return {
			pathParametersType,
			queryParametersType,
			queryParametersMapping:
				path.requestQueryParameters &&
				this.storage.get(path.requestQueryParameters)?.mapping,
			bodyTypeName: pathRequestBody && this.modelService.resolveType(pathRequestBody.content),
			multipart: pathRequestBody && this.multipartRe.test(pathRequestBody.media),
			dependencies,
		};
	}

	private getPathRequestBody(path: PathDef): PathRequestBody | undefined {
		let body: PathRequestBody | undefined;

		if (path.requestBodies) {
			body = path.requestBodies[0];

			if (path.requestBodies.length > 1) {
				Printer.verbose(
					`Multiple bodies found. Take first (${path.requestBodies[0]?.media})`,
				);
			}
		}

		return body;
	}

	private getResponse(path: PathDef): ITsPathResponse {
		const successResponse = path.responses?.find(x =>
			this.responseCodeRe.some(re => new RegExp(re).test(x.code)),
		);

		const responseType = successResponse?.content;

		if (!responseType) {
			return { typeName: 'void', dependencies: [] };
		}

		const dependencies: string[] = [];

		if (successResponse) {
			const responseDependencies = this.modelService.resolveDependencies(
				successResponse.content,
			);

			dependencies.push(...responseDependencies);
		}

		return {
			dependencies,
			typeName: this.modelService.resolveType(responseType),
			description:
				responseType instanceof EnumDef || responseType instanceof ObjectModelDef
					? responseType.description
					: undefined,
		};
	}

	private getImportEntries(paths: ITsPath[], currentFilePath: string): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			dependencies.push(...p.request.dependencies, ...p.response.dependencies);
		}

		return this.importRegistry.getImportEntries(dependencies, currentFilePath);
	}
}
