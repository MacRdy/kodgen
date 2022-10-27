import { IDocument } from '../../core/entities/document.model';
import { ObjectModelDef, ResolveFn } from '../../core/entities/model.model';
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
		const files: IGeneratorFile[] = [];

		const models = doc.models.filter(x => x instanceof ObjectModelDef) as ObjectModelDef[];

		for (const m of models) {
			const properties: INgtsModelProperty[] = [];

			for (const p of m.properties) {
				const prop: INgtsModelProperty = {
					name: toCamelCase(p.name),
					nullable: !!p.nullable,
					required: !!p.required,
					type: '',
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
}
