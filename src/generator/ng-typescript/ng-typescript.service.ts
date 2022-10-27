import { PathDef } from 'src/core/entities/path.model';
import { IDocument } from '../../core/entities/document.model';
import { EnumDef } from '../../core/entities/enum.model';
import {
	ArrayModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModelDef,
	ResolveFn,
} from '../../core/entities/model.model';
import { SchemaEntity } from '../../core/entities/shared.model';
import { toCamelCase, toKebabCase, toPascalCase } from '../../core/utils';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { INgtsEnum, INgtsEnumEntry, INgtsModel, INgtsModelProperty } from './ng-typescript.model';

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

			const model: INgtsEnum = {
				name: toPascalCase(e.name),
				isStringlyTyped: e.type === 'string',
				entries,
			};

			const file: IGeneratorFile = {
				path: `./enums/${toKebabCase(e.name)}.ts`,
				templateUrl: 'enum',
				templateData: { model },
			};

			files.push(file);
		}

		return files;
	}

	private getModelFiles(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const tsNgPropertyTypeResolver = (prop: SchemaEntity, isArray?: boolean): string => {
			let type: string | undefined;

			if (prop instanceof ReferenceModelDef) {
				const def = resolve(prop.definitionRef.get());
				type = tsNgPropertyTypeResolver(def);
			} else if (prop instanceof ObjectModelDef || prop instanceof EnumDef) {
				type = toPascalCase(prop.name);
			} else if (prop instanceof ArrayModelDef) {
				const items = resolve(prop.itemsRef.get());
				type = tsNgPropertyTypeResolver(items, true);
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
		};

		const files: IGeneratorFile[] = [];

		for (const m of doc.models) {
			const properties: INgtsModelProperty[] = [];

			for (const p of m.properties) {
				const target = p instanceof ReferenceModelDef ? resolve(p.definitionRef.get()) : p;

				const prop: INgtsModelProperty = {
					name: toCamelCase(p.name),
					nullable: !!p.nullable,
					required: !!p.required,
					type: tsNgPropertyTypeResolver(target),
				};

				properties.push(prop);
			}

			const model: INgtsModel = {
				name: toPascalCase(m.name),
				properties,
			};

			const file: IGeneratorFile = {
				path: `models/${toKebabCase(m.name)}.ts`,
				templateUrl: 'model',
				templateData: { model },
			};

			files.push(file);
		}

		return files;
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
			);

			files.push(file);
		}

		if (commonPaths.length) {
			const file = this.getSpecificServiceFile('Common', 'common.service.ts', commonPaths);

			files.push(file);
		}

		return files;
	}

	private getSpecificServiceFile(name: string, path: string, paths: PathDef[]): IGeneratorFile {
		throw new Error();
	}
}
