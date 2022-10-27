import kebabCase from 'just-kebab-case';
import { IDocument } from '../../core/entities/document.model';
import { ResolveFn } from '../../core/entities/model.model';
import { generateModelName } from '../../core/utils';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { INgtsEnum, INgtsEnumEntry } from './ng-typescript.model';

export class NgTypescriptService implements IGenerator {
	getName(): string {
		return 'ng-typescript';
	}

	getTemplateFolder(): string {
		return './src/generator/ng-typescript/templates';
	}

	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
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
				name: generateModelName(e.name),
				isStringlyTyped: e.type === 'string',
				entries,
			};

			const file: IGeneratorFile = {
				path: `./enums/${kebabCase(e.name)}.ts`,
				templateUrl: 'enum',
				templateData: { model },
			};

			files.push(file);
		}

		return files;
	}
}
