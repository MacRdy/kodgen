import pathLib from 'path';
import { EnumDef } from '../../core/entities/enum.model';
import { ArrayModelDef, ObjectModelDef } from '../../core/entities/model.model';
import { PathDef, PathMethod } from '../../core/entities/path.model';
import { assertUnreachable, toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import {
	generateEntityName,
	generateImportEntries,
	generatePropertyName,
	INgtsImportEntry,
	INgtsPath,
	NgtsPathMethod,
} from './ng-typescript.model';

export class NgTypescriptPathService {
	private readonly modelService = new NgTypescriptModelService(this.registry);

	constructor(private readonly registry: Map<string, string>) {}

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
					return assertUnreachable(value);
			}
		};

		const pathsModels: INgtsPath[] = [];

		for (const p of paths) {
			const dependencies: string[] = [];

			const requestPathParameters = p.requestPathParameters
				? this.modelService.getProperties(p.requestPathParameters.properties)
				: undefined;

			if (requestPathParameters) {
				for (const p of requestPathParameters) {
					dependencies.push(...p.dependencies);
				}
			}

			const requestQueryParametersModelName = p.requestQueryParameters
				? this.modelService.resolvePropertyType(p.requestQueryParameters)
				: undefined;

			if (requestQueryParametersModelName) {
				dependencies.push(requestQueryParametersModelName);
			}

			const requestQueryParametersMapping = p.requestQueryParameters?.properties.map(
				p =>
					[
						p.name,
						p.name
							.split('.')
							.map(x => generatePropertyName(x))
							.join('?.'),
					] as const,
			);

			const requestBody = p.requestBody?.find(x => x.media === 'application/json');

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

			const successResponse = p.responses?.find(x => x.code.startsWith('2'));

			if (successResponse) {
				responseModelName = this.modelService.resolvePropertyType(successResponse.content);

				if (
					successResponse.content instanceof ArrayModelDef &&
					(successResponse.content.itemsDef instanceof EnumDef ||
						successResponse.content.itemsDef instanceof ObjectModelDef)
				) {
					const dependencyModelName = this.modelService.resolvePropertyType(
						successResponse.content,
						false,
						true,
					);

					dependencies.push(dependencyModelName);
				} else if (
					successResponse.content instanceof EnumDef ||
					successResponse.content instanceof ObjectModelDef
				) {
					dependencies.push(responseModelName);
				}
			}

			const path: INgtsPath = {
				name: generatePropertyName(p.urlPattern, p.method),
				method: methodNameResolver(p.method),
				urlPattern: p.urlPattern,
				requestPathParameters,
				requestQueryParametersModelName,
				requestQueryParametersMapping,
				requestBodyModelName,
				responseModelName,
				dependencies,
			};

			pathsModels.push(path);
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

	private buildImports(paths: INgtsPath[], currentFilePath: string): INgtsImportEntry[] {
		const dependencies: string[] = [];

		for (const p of paths) {
			dependencies.push(...p.dependencies);
		}

		return generateImportEntries(dependencies, currentFilePath, this.registry);
	}
}
