import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/model-def.model';
import { PathDef, PathMethod } from '@core/entities/schema-entities/path-def.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { IImportRegistryEntry } from '@core/import-registry/import-registry.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import {
	generateEntityName,
	generateMethodName,
	generatePropertyName,
	INgtsModelProperty,
	INgtsPath,
} from './ng-typescript.model';

export class NgTypescriptPathService {
	private readonly modelService = new NgTypescriptModelService(this.registry);

	private readonly httpMethods: readonly PathMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

	private readonly multipartRe = /multipart\/form-data/gi;

	private readonly requestBodyMediaRe: RegExp[] = [
		/^(application\/json|[^;/ \t]+\/[^;/ \t]+\+json)[ \t]*(;.*)?$/gi,
		/application\/json-patch\+json/gi,
		this.multipartRe,
	];

	private readonly responseCodeRe: RegExp[] = [/^2/g, /^default$/gi];

	constructor(private readonly registry: ImportRegistryService) {}

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
				pathLib.posix.join('services', `${toKebabCase(entityName)}.service`),
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
		const pathsModels: INgtsPath[] = [];

		for (const path of paths) {
			if (!this.httpMethods.includes(path.method)) {
				continue;
			}

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

			const { type: responseType, dependencies: responseDependencies } =
				this.getResponseType(path);

			const pathModel: INgtsPath = {
				name: generateMethodName(path.urlPattern, path.method),
				method: path.method,
				urlPattern: path.urlPattern,
				requestPathParameters,
				requestQueryParametersType,
				requestQueryParametersMapping,
				isMultipart,
				extensions: path.extensions,
				requestBodyType,
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
				getImportEntries: () => this.getImportEntries(pathsModels, filePath),
				parametrizeUrlPattern: (urlPattern: string) =>
					urlPattern.replace(
						/{([^}]+)(?=})}/g,
						(_, capture: string) => '${' + generatePropertyName(capture) + '}',
					),
			},
		};
	}

	private getRequestPathParametersInfo(path: PathDef): {
		dependencies: string[];
		parameters?: INgtsModelProperty[];
	} {
		const dependencies: string[] = [];

		const parameters = path.requestPathParameters
			? this.modelService.getProperties(path.requestPathParameters.properties)
			: undefined;

		if (parameters) {
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

		const type = path.requestQueryParameters
			? this.modelService.resolvePropertyType(path.requestQueryParameters)
			: undefined;

		if (type) {
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

	private getResponseType(path: PathDef): { type: string; dependencies: string[] } {
		const dependencies: string[] = [];

		let type = 'void';

		const successResponse = path.responses?.find(x =>
			this.responseCodeRe.some(re => new RegExp(re).test(x.code)),
		);

		if (successResponse) {
			type = this.modelService.resolvePropertyType(successResponse.content);

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
		};
	}

	private getImportEntries(paths: INgtsPath[], currentFilePath: string): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			dependencies.push(...p.dependencies);
		}

		return this.registry.getImportEntries(dependencies, currentFilePath);
	}
}
