import ejs from 'ejs';
import fs from 'fs';
import path from 'path';
import { TemplateData } from './renderer.model';

export class RendererService {
	async render(
		outputPath: string,
		filePath: string,
		templateFolder: string,
		templateName: string,
		templateData?: TemplateData,
	): Promise<void> {
		const content = await this.renderTemplate(templateFolder, templateName, templateData);

		const outputFilePath = path.join(outputPath, filePath);
		await this.createFile(outputFilePath, content);
	}

	private renderTemplate(folder: string, name: string, data?: TemplateData): Promise<string> {
		return new Promise<string>((res, rej) => {
			const templatePath = path.join(folder, `${name}.ejs`);

			ejs.renderFile(templatePath, data ?? {}, (err, content) => {
				if (err) {
					rej(err);
					return;
				}

				res(content);
			});
		});
	}

	private async createFile(filePath: string, content: string): Promise<void> {
		const dir = path.join(...filePath.split(path.sep).slice(0, -1));

		if (!dir) {
			throw new Error('Directory cannot not be resolved.');
		}

		console.log(dir);

		if (!fs.existsSync(dir)) {
			await fs.promises.mkdir(dir, { recursive: true });
		}

		await fs.promises.writeFile(filePath, content, { flag: 'w' });
	}
}
