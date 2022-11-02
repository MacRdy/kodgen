import ejs from 'ejs';
import { TemplateData } from './renderer.model';

export class RendererService {
	async render(path: string, data?: TemplateData): Promise<string> {
		return new Promise<string>((res, rej) => {
			ejs.renderFile(path, data ?? {}, (err, content) => {
				if (err) {
					rej(err);
				} else {
					res(content);
				}
			});
		});
	}

	getExtension(): string {
		return '.ejs';
	}
}
