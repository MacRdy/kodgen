import pathLib from 'path';
import { EnumDef } from '../../core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../core/entities/schema-entities/model-def.model';
import { PathDef, PathMethod } from '../../core/entities/schema-entities/path-def.model';
import { SimpleModelDef } from '../../core/entities/schema-entities/simple-model-def.model';
import { IImportRegistryEntry } from '../../core/import-registry/import-registry.model';
import { ImportRegistryService } from '../../core/import-registry/import-registry.service';
import { toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import {
	generateEntityName,
	generatePropertyName,
	INgtsPath,
	NgtsPathMethod,
} from './ng-typescript.model';

export class NgTypescriptPathService {
	private readonly modelService = new NgTypescriptModelService(this.registry);

	private readonly httpMethods: readonly PathMethod[] = ['GET', 'POST', 'PUT', 'DELETE'];

	private readonly requestBodyMediaRe: RegExp[] = [
		/^(application\/json|[^;/ \t]+\/[^;/ \t]+\+json)[ \t]*(;.*)?$/gi,
		/application\/json-patch\+json/gi,
		/multipart\/form-data/gi,
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
			const file = this.getSpecificServiceFile(
				generateEntityName(name),
				pathLib.posix.join('services', `${toKebabCase(name)}.service.ts`),
				p,
			);

			files.push(file);
		}

		if (commonPaths.length) {
			const file = this.getSpecificServiceFile('Common', 'common.service.ts', commonPaths);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(
		name: string,
		filePath: string,
		paths: PathDef[],
	): IGeneratorFile {
		const methodNameResolver = (value: PathMethod): NgtsPathMethod => {
			switch (value) {
				case 'GET':
					return 'get';
				case 'POST':
					return 'post';
				case 'PUT':
					return 'put';
				case 'DELETE':
					return 'delete';
				default:
					throw new Error('Unexpected http method.');
			}
		};

		const pathsModels: INgtsPath[] = [];

		for (const path of paths) {
			if (!this.httpMethods.includes(path.method)) {
				continue;
			}

			const dependencies: string[] = [];

			const requestPathParameters = path.requestPathParameters
				? this.modelService.getProperties(path.requestPathParameters.properties)
				: undefined;

			if (requestPathParameters) {
				for (const rpp of requestPathParameters) {
					dependencies.push(...rpp.dependencies);
				}
			}

			const requestQueryParametersModelName = path.requestQueryParameters
				? this.modelService.resolvePropertyType(path.requestQueryParameters)
				: undefined;

			if (requestQueryParametersModelName) {
				dependencies.push(requestQueryParametersModelName);
			}

			const requestQueryParametersMapping = path.requestQueryParameters?.properties.map(
				p =>
					[
						p.name,
						p.name
							.split('.')
							.map(x => generatePropertyName(x))
							.join('?.'),
					] as const,
			);

			const requestBody = path.requestBody?.find(x =>
				this.requestBodyMediaRe.some(re => new RegExp(re).test(x.media)),
			);

			const requestBodyModelName = requestBody?.content
				? this.modelService.resolvePropertyType(requestBody?.content)
				: undefined;

			if (
				requestBodyModelName &&
				(requestBody?.content instanceof EnumDef ||
					requestBody?.content instanceof ObjectModelDef)
			) {
				dependencies.push(requestBodyModelName);
			}

			let responseModelName = 'void';

			const successResponse = path.responses?.find(x =>
				this.responseCodeRe.some(re => new RegExp(re).test(x.code)),
			);

			if (successResponse) {
				responseModelName = this.modelService.resolvePropertyType(successResponse.content);

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

			const pathModel: INgtsPath = {
				name: generatePropertyName(path.urlPattern, path.method),
				method: methodNameResolver(path.method),
				urlPattern: path.urlPattern,
				isMultipart: !!requestBodyModelName && requestBody?.media === 'multipart/form-data',
				requestPathParameters,
				requestQueryParametersModelName,
				requestQueryParametersMapping,
				requestBodyModelName,
				responseModelName,
				dependencies,
			};

			pathsModels.push(pathModel);
		}

		return {
			path: filePath,
			templateUrl: 'service',
			templateData: {
				name,
				paths: pathsModels,
				parametrizeUrlPattern: (urlPattern: string) =>
					urlPattern.replace(/{([^}]+)(?=})}/g, '$${$1}'),
				buildImports: () => this.buildImports(pathsModels, filePath),
			},
		};
	}

	private buildImports(paths: INgtsPath[], currentFilePath: string): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			dependencies.push(...p.dependencies);
		}

		return this.registry.getImportEntries(dependencies, currentFilePath);
	}
}
