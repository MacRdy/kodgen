import ejs from 'ejs';
import path from 'path';
import { TemplateData } from './renderer.model';

export class RendererService {
	render(folder: string, name: string, data?: TemplateData): Promise<string> {
		return new Promise<string>((res, rej) => {
			const templatePath = path.join(folder, `${name}.ejs`);

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
