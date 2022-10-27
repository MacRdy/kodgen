import { IDocument } from '../../core/entities/document.model';
import { ResolveFn } from '../../core/entities/model.model';
import { IGenerator, IGeneratorFile } from '../generator.model';

export class TestGeneratorService implements IGenerator {
	getName(): string {
		return 'test-generator';
	}

	getTemplateFolder(): string {
		return './generator/test-generator/templates';
	}

	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		const file: IGeneratorFile = {
			path: './test-file.txt',
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
