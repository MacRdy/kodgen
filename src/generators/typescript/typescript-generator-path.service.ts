import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { PathDef } from '@core/entities/schema-entities/path-def.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { IImportRegistryEntry } from '@core/import-registry/import-registry.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import { IJSDocMethod, IJSDocMethodParam } from './jsdoc/jsdoc.model';
import { JSDocService } from './jsdoc/jsdoc.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import {
	generateEntityName,
	generateMethodName,
	generatePropertyName,
	ITsGeneratorConfig,
	ITsModelProperty,
	ITsPath,
} from './typescript-generator.model';

export class TypescriptGeneratorPathService {
	private readonly modelService = new TypescriptGeneratorModelService(this.registry, this.config);

	private readonly multipartRe = /multipart\/form-data/gi;

	private readonly requestBodyMediaRe: RegExp[] = [
		/^(application\/json|[^;/ \t]+\/[^;/ \t]+\+json)[ \t]*(;.*)?$/gi,
		/application\/json-patch\+json/gi,
		this.multipartRe,
	];

	private readonly responseCodeRe: RegExp[] = [/^2/g, /^default$/gi];

	constructor(
		private readonly registry: ImportRegistryService,
		private readonly config: ITsGeneratorConfig,
	) {}

	generate(paths: PathDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		const pathsToGenerate: Record<string, PathDef[]> = {};
		const commonPaths: PathDef[] = [];

		for (const path of paths) {
			if (path.tags?.length && path.tags[0]) {
				const tag = path.tags[0];

				const tagPaths = pathsToGenerate[tag];

				if (tagPaths) {
					tagPaths.push(path);
				} else {
					pathsToGenerate[tag] = [path];
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
			const file = this.getSpecificServiceFile('Common', 'common.service', commonPaths);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(
		name: string,
		filePath: string,
		paths: PathDef[],
	): IGeneratorFile {
		const pathsModels: ITsPath[] = [];

		for (const path of paths) {
			const {
				parameters: requestPathParameters,
				dependencies: requestPathParametersDependencies,
			} = this.getRequestPathParametersInfo(path);

			const {
				type: requestQueryParametersType,
				mapping: requestQueryParametersMapping,
				dependencies: requestQueryParametersDependencies,
			} = this.getRequestQueryParametersInfo(path);

			const {
				type: requestBodyType,
				isMultipart,
				dependencies: requestBodyDependencies,
			} = this.getRequestBodyInfo(path);

			const {
				type: responseType,
				description: responseTypeDescription,
				dependencies: responseDependencies,
			} = this.getResponseType(path);

			const pathModel: ITsPath = {
				name: generateMethodName(path.urlPattern, path.method),
				method: path.method,
				urlPattern: path.urlPattern,
				deprecated: path.deprecated,
				summaries: path.summaries,
				descriptions: path.descriptions,
				requestPathParameters,
				requestQueryParametersType,
				requestQueryParametersMapping,
				isMultipart,
				extensions: path.extensions,
				requestBodyType,
				responseTypeDescription,
				responseType,
				dependencies: [
					...requestPathParametersDependencies,
					...requestQueryParametersDependencies,
					...requestBodyDependencies,
					...responseDependencies,
				],
			};

			pathsModels.push(pathModel);
		}

		return {
			path: filePath,
			template: 'service',
			templateData: {
				name,
				paths: pathsModels,
				jsdoc: new JSDocService(),
				toJSDocMethod: (path: ITsPath, pathName: string) =>
					this.toJSDocMethod(path, pathName),
				getImportEntries: () => this.getImportEntries(pathsModels, filePath),
				parametrizeUrlPattern: (urlPattern: string) =>
					urlPattern.replace(
						/{([^}]+)(?=})}/g,
						(_, capture: string) => '${' + capture + '}',
					),
			},
		};
	}

	private toJSDocMethod(
		path: ITsPath,
		name?: string,
		queryParametersVarName = 'request',
		bodyParametersVarName = 'requestBody',
	): IJSDocMethod {
		const params: IJSDocMethodParam[] = [];

		if (path.requestPathParameters) {
			for (const param of path.requestPathParameters) {
				params.push({
					name: param.name,
					type: param.type,
					description: param.description,
				});
			}
		}

		if (path.requestQueryParametersType) {
			params.push({
				name: queryParametersVarName,
				type: path.requestQueryParametersType,
				description: 'Request query parameters',
			});
		}

		if (path.requestBodyType) {
			params.push({
				name: bodyParametersVarName,
				type: path.requestBodyType,
				description: 'Request body',
			});
		}

		return {
			name,
			params,
			deprecated: path.deprecated,
			summaries: path.summaries,
			descriptions: path.descriptions,
			returns: {
				description: path.responseTypeDescription,
			},
		};
	}

	private getRequestPathParametersInfo(path: PathDef): {
		dependencies: string[];
		parameters?: ITsModelProperty[];
	} {
		const dependencies: string[] = [];

		let parameters: ITsModelProperty[] | undefined;

		if (path.requestPathParameters) {
			parameters = this.modelService.getProperties(path.requestPathParameters.properties);

			for (const rpp of parameters) {
				dependencies.push(...rpp.dependencies);
			}
		}

		return {
			dependencies,
			parameters,
		};
	}

	private getRequestQueryParametersInfo(path: PathDef): {
		dependencies: string[];
		type?: string;
		mapping?: (readonly [string, string])[];
	} {
		const dependencies: string[] = [];

		let type: string | undefined;

		if (path.requestQueryParameters) {
			type = this.modelService.resolvePropertyType(path.requestQueryParameters);

			dependencies.push(type);
		}

		const mapping = path.requestQueryParameters?.properties.map(
			p =>
				[
					p.name,
					p.name
						.split('.')
						.map(x => generatePropertyName(x))
						.join('?.'),
				] as const,
		);

		return {
			dependencies,
			mapping,
			type,
		};
	}

	private getRequestBodyInfo(path: PathDef): {
		isMultipart: boolean;
		dependencies: string[];
		type?: string;
	} {
		const dependencies: string[] = [];

		const requestBody = path.requestBody?.find(x =>
			this.requestBodyMediaRe.some(re => new RegExp(re).test(x.media)),
		);

		const type = requestBody?.content
			? this.modelService.resolvePropertyType(requestBody?.content)
			: undefined;

		if (
			type &&
			(requestBody?.content instanceof EnumDef ||
				requestBody?.content instanceof ObjectModelDef)
		) {
			dependencies.push(type);
		}

		return {
			dependencies,
			type,
			isMultipart: !!type && !!requestBody?.media && this.multipartRe.test(requestBody.media),
		};
	}

	private getResponseType(path: PathDef): {
		type: string;
		dependencies: string[];
		description?: string;
	} {
		const dependencies: string[] = [];

		let type = 'void';
		let description: string | undefined;

		const successResponse = path.responses?.find(x =>
			this.responseCodeRe.some(re => new RegExp(re).test(x.code)),
		);

		if (successResponse) {
			type = this.modelService.resolvePropertyType(successResponse.content);

			if (
				successResponse.content instanceof EnumDef ||
				successResponse.content instanceof ObjectModelDef
			) {
				description = successResponse.content.description;
			}

			const propertyDef = this.modelService.resolvePropertyDef(successResponse.content);

			if (!(propertyDef instanceof SimpleModelDef)) {
				const propertyType = this.modelService.resolvePropertyType(
					successResponse.content,
					false,
					true,
				);

				dependencies.push(propertyType);
			}
		}

		return {
			dependencies,
			type,
			description,
		};
	}

	private getImportEntries(paths: ITsPath[], currentFilePath: string): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			dependencies.push(...p.dependencies);
		}

		return this.registry.getImportEntries(dependencies, currentFilePath);
	}
}
