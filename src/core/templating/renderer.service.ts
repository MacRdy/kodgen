import ejs from 'ejs';
import fs from 'fs';
import { resolve } from 'path';
import { TemplateData } from './renderer.model';

export class RendererService {
	async render(
		outputPath: string,
		path: string,
		templateFolder: string,
		templateName: string,
		templateData?: TemplateData,
	): Promise<void> {
		const content = await this.renderTemplate(templateFolder, templateName, templateData);

		const filePath = resolve(outputPath, path);
		await this.createFile(filePath, content);
	}

	private renderTemplate(folder: string, name: string, data?: TemplateData): Promise<string> {
		return new Promise<string>((res, rej) => {
			const templatePath = resolve(folder, `${name}.ejs`);

			ejs.renderFile(templatePath, data ?? {}, (err, content) => {
				if (err) {
					rej(err);
					return;
				}

				res(content);
			});
		});
	}

	private async createFile(path: string, content: string): Promise<void> {
		return new Promise((res, rej) => {
			fs.writeFile(path, content, { flag: 'w' }, err => {
				if (err) {
					rej(err);
					return;
				}

				res();
			});
		});
	}
}
