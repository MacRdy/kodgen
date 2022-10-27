import { IDocument } from '../../core/entities/document.model';
import { ResolveFn } from '../../core/entities/model.model';
import { IGenerator, IGeneratorFile } from '../generator.model';

export class TestGeneratorService implements IGenerator {
	private readonly templateFolder = './src/generator/test-generator/templates';
	getName(): string {
		return 'test-generator';
	}

	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		const file: IGeneratorFile = {
			path: './test-file.txt',
			templateFolder: this.templateFolder,
			templateName: 'test',
			templateData: {
				name: `It's name`,
				lastName: `It's last name`,
			},
		};

		files.push(file);

		return files;
	}
}
