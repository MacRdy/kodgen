import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { PathDef, PathRequestBody } from '@core/entities/schema-entities/path-def.model';
import { SchemaEntity } from '@core/entities/shared.model';
import { IImportRegistryEntry } from '@core/import-registry/import-registry.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { Storage } from '@core/storage/storage.service';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import { IJSDocConfig, IJSDocConfigParam } from './jsdoc/jsdoc.model';
import { JSDocService } from './jsdoc/jsdoc.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import {
	generateEntityName,
	generateMethodName,
	generatePropertyName,
	isDependency,
	ITsGeneratorConfig,
	ITsModel,
	ITsPath,
	ITsPathRequest,
	ITsPathRequestQueryParametersMapping,
	ITsPathResponse,
} from './typescript-generator.model';

export class TypescriptGeneratorPathService {
	private readonly multipartRe = /multipart\/form-data/gi;

	private readonly requestBodyMediaRe: RegExp[] = [
		/^(application\/json|[^;/ \t]+\/[^;/ \t]+\+json)[ \t]*(;.*)?$/gi,
		/application\/json-patch\+json/gi,
		this.multipartRe,
	];

	private readonly responseCodeRe: RegExp[] = [/^2/g, /^default$/gi];

	constructor(
		private readonly modelService: TypescriptGeneratorModelService,
		private readonly modelStorage: Storage<ObjectModelDef, ITsModel[]>,
		private readonly importRegistry: ImportRegistryService,
		private readonly config: ITsGeneratorConfig,
	) {}

	generate(paths: PathDef[]): IGeneratorFile[] {
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
			const entityName = generateEntityName(name);

			const file = this.getSpecificServiceFile(
				entityName,
				pathLib.posix.join(
					this.config.pathDir,
					this.config.pathFileNameResolver(entityName),
				),
				p,
			);

			files.push(file);
		}

		if (commonPaths.length) {
			const file = this.getSpecificServiceFile(
				generateEntityName('common'),
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
	): IGeneratorFile {
		const paths: ITsPath[] = [];

		for (const path of pathDefs) {
			const pathModel: ITsPath = {
				name: generateMethodName(path.urlPattern, path.method),
				urlPattern: path.urlPattern,
				method: path.method,
				request: this.getRequest(path),
				response: this.getResponse(path),
				deprecated: path.deprecated,
				summaries: path.summaries,
				descriptions: path.descriptions,
				extensions: path.extensions,
			};

			paths.push(pathModel);
		}

		return {
			path: filePath,
			template: 'service',
			templateData: {
				name,
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
		const pathParametersType = this.getRequestPathParameters(path);
		const queryParametersType = this.getRequestQueryParameters(path);

		const pathRequestBody = this.getPathRequestBody(path);

		const bodyTypeName =
			pathRequestBody && this.modelService.resolvePropertyType(pathRequestBody.content);

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
			const dependency = this.resolveDependency(pathRequestBody.content);

			if (dependency) {
				dependencies.push(dependency);
			}
		}

		return {
			pathParametersType,
			queryParametersType,
			queryParametersMapping: this.getQueryParametersMapping(path),
			bodyTypeName,
			multipart: pathRequestBody && this.multipartRe.test(pathRequestBody.media),
			dependencies,
		};
	}

	private getRequestPathParameters(path: PathDef): ITsModel | undefined {
		if (path.requestPathParameters) {
			const tsModels = this.modelStorage.get(path.requestPathParameters);

			const tsModel = tsModels?.[0];

			if (tsModel) {
				return tsModel;
			}
		}

		return undefined;
	}

	private getRequestQueryParameters(path: PathDef): ITsModel | undefined {
		if (path.requestQueryParameters) {
			const tsModels = this.modelStorage.get(path.requestQueryParameters);

			const tsModel = tsModels?.[0];

			if (tsModel) {
				return tsModel;
			}
		}

		return undefined;
	}

	private getQueryParametersMapping(
		path: PathDef,
	): ITsPathRequestQueryParametersMapping[] | undefined {
		return path.requestQueryParameters?.properties.map<ITsPathRequestQueryParametersMapping>(
			p => ({
				originalName: p.name,
				objectPath: p.name.split('.').map(x => generatePropertyName(x)),
			}),
		);
	}

	private getPathRequestBody(path: PathDef): PathRequestBody | undefined {
		return path.requestBody?.find(x =>
			this.requestBodyMediaRe.some(re => new RegExp(re).test(x.media)),
		);
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
			const dependency = this.resolveDependency(successResponse.content);

			if (dependency) {
				dependencies.push(dependency);
			}
		}

		return {
			dependencies,
			typeName: this.modelService.resolvePropertyType(responseType),
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

	private resolveDependency(entity: SchemaEntity): string | undefined {
		const propertyDef = this.modelService.resolvePropertyDef(entity);

		if (!isDependency(propertyDef)) {
			return undefined;
		}

		return this.modelService.resolvePropertyType(entity, false, true);
	}
}
