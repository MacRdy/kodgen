import { IDocument } from '../../core/entities/document.model';
import { EnumDef } from '../../core/entities/enum.model';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModelDef,
} from '../../core/entities/model.model';
import { PathDef, PathMethod } from '../../core/entities/path.model';
import { SchemaEntity } from '../../core/entities/shared.model';
import { assertUnreachable, toCamelCase, toKebabCase, toPascalCase } from '../../core/utils';
import { IGenerator, IGeneratorFile } from '../generator.model';
import {
	INgtsEnum,
	INgtsEnumEntry,
	INgtsModel,
	INgtsModelProperty,
	INgtsPath,
	NgtsPathMethod,
} from './ng-typescript.model';

export class NgTypescriptService implements IGenerator {
	getName(): string {
		return 'ng-typescript';
	}

	getTemplateFolder(): string {
		return './src/generator/ng-typescript/templates';
	}

	generate(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [
			...this.getEnumFiles(doc),
			...this.getModelFiles(doc),
			...this.getServiceFiles(doc),
		];

		this.spiceUp(files);

		return files;
	}

	private spiceUp(files: IGeneratorFile[]): void {
		const spices: Record<string, unknown> = {
			isValidName: (name: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(name),
		};

		for (const file of files) {
			if (file.templateData) {
				file.templateData = {
					...file.templateData,
					...spices,
				};
			} else {
				file.templateData = spices;
			}
		}
	}

	private getEnumFiles(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const e of doc.enums) {
			const entries: INgtsEnumEntry[] = [];

			for (const enumEntry of e.entries) {
				const entry: INgtsEnumEntry = {
					name: enumEntry.name,
					value: enumEntry.value,
				};

				entries.push(entry);
			}

			const templateData: INgtsEnum = {
				name: toPascalCase(e.name),
				isStringlyTyped: e.type === 'string',
				entries,
			};

			const file: IGeneratorFile = {
				path: `./enums/${toKebabCase(e.name)}.ts`,
				templateUrl: 'enum',
				templateData,
			};

			files.push(file);
		}

		return files;
	}

	private getModelFiles(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const m of doc.models) {
			const file: IGeneratorFile = {
				path: `models/${toKebabCase(m.name)}.ts`,
				templateUrl: 'model',
				templateData: this.getModel(m),
			};

			files.push(file);
		}

		return files;
	}

	private getModel(objectModel: ObjectModelDef): INgtsModel {
		return {
			name: toPascalCase(objectModel.name),
			properties: this.getProperties(objectModel.properties),
		};
	}

	private getProperties(models: ReadonlyArray<ModelDef>): INgtsModelProperty[] {
		const properties: INgtsModelProperty[] = [];

		for (const p of models) {
			const target = p instanceof ReferenceModelDef ? p.def : p;

			const prop: INgtsModelProperty = {
				name: p.name,
				nullable: !!p.nullable,
				required: !!p.required,
				type: this.resolvePropertyType(target),
			};

			properties.push(prop);
		}

		return properties;
	}

	private resolvePropertyType(prop: SchemaEntity, isArray?: boolean): string {
		let type: string;

		if (prop instanceof ReferenceModelDef) {
			type = this.resolvePropertyType(prop.def);
		} else if (prop instanceof ObjectModelDef || prop instanceof EnumDef) {
			type = toPascalCase(prop.name);
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolvePropertyType(prop.itemsDef, true);
		} else if (prop instanceof PrimitiveModelDef) {
			if (prop.type === 'boolean') {
				type = 'boolean';
			} else if (prop.type === 'integer' || prop.type === 'number') {
				type = 'number';
			} else if (prop.type === 'string') {
				type = 'string';
			}
		}

		type ??= 'unknown';

		return `${type}${isArray ? '[]' : ''}`;
	}

	private getServiceFiles(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		const paths: Record<string, PathDef[]> = {};
		const commonPaths: PathDef[] = [];

		for (const path of doc.paths) {
			if (path.tags?.length && path.tags[0]) {
				const tag = path.tags[0];

				const tagPaths = paths[tag];

				if (tagPaths) {
					tagPaths.push(path);
				} else {
					paths[tag] = [path];
				}
			} else {
				commonPaths.push(path);
			}
		}

		for (const [name, p] of Object.entries(paths)) {
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
				? this.getProperties(p.requestPathParameters.properties)
				: undefined;

			const requestQueryParametersModelName = p.requestQueryParameters?.name;

			const requestBody = p.requestBody?.find(x => x.media === 'application/json');
			const requestBodyModelName = requestBody?.content.name;

			const successResponse = p.responses?.find(x => x.code.startsWith('2'));

			const responseModelName = successResponse
				? this.resolvePropertyType(successResponse.content)
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
