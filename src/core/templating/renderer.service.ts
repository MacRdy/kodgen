import ejs from 'ejs';
import fs from 'fs';
import { resolve } from 'path';
import { TemplateData } from './renderer.model';

export class RendererService {
	render(
		outputPath: string,
		path: string,
		templateFolder: string,
		templateName: string,
		templateData: TemplateData,
	): Promise<void> {
		return new Promise((res, rej) => {
			const templatePath = resolve(templateFolder, templateName, '.ejs');

			ejs.renderFile(templatePath, templateData, (err, content) => {
				if (err) {
					rej(err.message);
					return;
				}

				const filePath = resolve(outputPath, path);
				this.createFile(filePath, content);

				res();
			});
		});
	}

	private createFile(path: string, content: string): void {
		fs.writeFileSync(path, content);
	}
}
