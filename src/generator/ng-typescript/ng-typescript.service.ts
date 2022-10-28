import { IDocument } from '../../core/entities/document.model';
import { EnumDef } from '../../core/entities/enum.model';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModelDef,
	ResolveFn,
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

	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const files: IGeneratorFile[] = [
			...this.getEnumFiles(doc),
			...this.getModelFiles(doc, resolve),
			...this.getServiceFiles(doc, resolve),
		];

		return files;
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

	private getModelFiles(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const m of doc.models) {
			const file: IGeneratorFile = {
				path: `models/${toKebabCase(m.name)}.ts`,
				templateUrl: 'model',
				templateData: this.getModel(m, resolve),
			};

			files.push(file);
		}

		return files;
	}

	private getModel(objectModel: ObjectModelDef, resolve: ResolveFn): INgtsModel {
		return {
			name: toPascalCase(objectModel.name),
			properties: this.getProperties(objectModel.properties, resolve),
		};
	}

	private getProperties(
		models: ReadonlyArray<ModelDef>,
		resolve: ResolveFn,
	): INgtsModelProperty[] {
		const properties: INgtsModelProperty[] = [];

		for (const p of models) {
			const target = p instanceof ReferenceModelDef ? resolve(p.definitionRef.get()) : p;

			const prop: INgtsModelProperty = {
				name: toCamelCase(p.name),
				nullable: !!p.nullable,
				required: !!p.required,
				type: this.resolvePropertyType(target, resolve),
			};

			properties.push(prop);
		}

		return properties;
	}

	private resolvePropertyType(prop: SchemaEntity, resolve: ResolveFn, isArray?: boolean): string {
		let type: string | undefined;

		if (prop instanceof ReferenceModelDef) {
			const def = resolve(prop.definitionRef.get());
			type = this.resolvePropertyType(def, resolve);
		} else if (prop instanceof ObjectModelDef || prop instanceof EnumDef) {
			type = toPascalCase(prop.name);
		} else if (prop instanceof ArrayModelDef) {
			const items = resolve(prop.itemsRef.get());
			type = this.resolvePropertyType(items, resolve, true);
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

	private getServiceFiles(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
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
				resolve,
			);

			files.push(file);
		}

		if (commonPaths.length) {
			const file = this.getSpecificServiceFile(
				'Common',
				'common.service.ts',
				commonPaths,
				resolve,
			);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(
		name: string,
		filePath: string,
		paths: PathDef[],
		resolve: ResolveFn,
	): IGeneratorFile {
		const methodMapping = (value: PathMethod): NgtsPathMethod => {
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
			// let parameters: INgtsModelProperty[] | undefined;

			// if (p.parameters) {
			// 	parameters = this.getProperties(p.parameters, resolve);
			// }

			let body: INgtsModel | undefined;

			const requestBody = p.requestBody?.find(x => x.media === 'application/json');

			if (requestBody) {
				if (!(requestBody.content instanceof ObjectModelDef)) {
					throw new Error('Unexpected request body model type.');
				}

				body = this.getModel(requestBody.content, resolve);
			}

			let responseTypeName: string | undefined;

			const successResponse = p.responses?.find(x => x.code.startsWith('2'));

			if (successResponse) {
				responseTypeName = this.resolvePropertyType(successResponse.content, resolve);
			}

			const path: INgtsPath = {
				name: `${toPascalCase(p.urlPattern)}${toPascalCase(p.method)}`,
				method: methodMapping(p.method),
				urlPattern: p.urlPattern,
				parameters: [],
				body,
				responseTypeName,
			};

			pathsModels.push(path);
		}

		return {
			path: filePath,
			templateUrl: 'service',
			templateData: {
				name,
				paths: pathsModels,
			},
		};
	}
}
