import ejs from 'ejs';
import path from 'path';
import { TemplateData } from './renderer.model';

export class RendererService {
	render(folder: string, name: string, data?: TemplateData): Promise<string> {
		return new Promise<string>((res, rej) => {
			const templateName = name.endsWith('.ejs') ? name : `${name}.ejs`;
			const templatePath = path.join(folder, templateName);

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
