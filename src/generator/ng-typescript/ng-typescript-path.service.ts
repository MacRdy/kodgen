import { PathDef, PathMethod } from '../../core/entities/path.model';
import { assertUnreachable, toCamelCase, toKebabCase, toPascalCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import { INgtsPath, NgtsPathMethod } from './ng-typescript.model';

export class NgTypescriptPathService {
	private readonly modelService = new NgTypescriptModelService();

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
				toPascalCase(name),
				`services/${toKebabCase(name)}.service.ts`,
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
			const requestPathParameters = p.requestPathParameters
				? this.modelService.getProperties(p.requestPathParameters.properties)
				: undefined;

			const requestQueryParametersModelName = p.requestQueryParameters?.name;

			const requestBody = p.requestBody?.find(x => x.media === 'application/json');
			const requestBodyModelName = requestBody?.content.name;

			const successResponse = p.responses?.find(x => x.code.startsWith('2'));

			const responseModelName = successResponse
				? this.modelService.resolvePropertyType(successResponse.content)
				: 'void';

			const path: INgtsPath = {
				name: `${toCamelCase(p.urlPattern)}${toPascalCase(p.method)}`,
				method: methodNameResolver(p.method),
				urlPattern: p.urlPattern,
				requestPathParameters,
				requestQueryParametersModelName,
				requestBodyModelName,
				responseModelName,
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
			},
		};
	}
}
