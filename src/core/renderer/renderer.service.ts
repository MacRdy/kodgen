import ejs from 'ejs';
import pathLib from 'path';
import { TemplateData } from './renderer.model';

export class RendererService {
	async render(directory: string, filePath: string, data?: TemplateData): Promise<string> {
		return new Promise<string>((res, rej) => {
			const templateFilePath = filePath.endsWith('.ejs') ? filePath : `${filePath}.ejs`;
			const templatePath = pathLib.join(directory, templateFilePath);

			ejs.renderFile(templatePath, data ?? {}, (err, content) => {
				if (err) {
					rej(err);
				} else {
					res(content);
				}
			});
		});
	}
}
