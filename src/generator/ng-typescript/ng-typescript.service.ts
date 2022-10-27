import kebabCase from 'just-kebab-case';
import { IDocument } from '../../core/entities/document.model';
import { ResolveFn } from '../../core/entities/model.model';
import { IGenerator, IGeneratorFile } from '../generator.model';

export class TestGeneratorService implements IGenerator {
	getName(): string {
		return 'ng-typescript';
	}

	getTemplateFolder(): string {
		return './src/generator/ng-typescript/templates';
	}

	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const e of doc.enums) {
			const file: IGeneratorFile = {
				path: `./enums/${kebabCase(e.name)}.ts`,
				templateUrl: 'enum',
				templateData: {
					data: e,
				},
			};

			files.push(file);
		}

		return files;
	}
}
