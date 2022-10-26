import { IDocument } from 'src/core/entities/document.model';
import { ResolveFn } from 'src/core/entities/model.model';
import { IGenerator, IGeneratorFile } from '../generator.model';

export class TestGeneratorService implements IGenerator {
	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		const file: IGeneratorFile = {
			path: './test-file.txt',
			template: 'test',
			data: {
				name: `It's name`,
				lastName: `It's last name`,
			},
		};

		files.push(file);

		return files;
	}
}
