import ejs from 'ejs';
import { TemplateData } from './renderer.model';

export class RendererService {
	async render(path: string, data?: TemplateData): Promise<string> {
		return ejs.renderFile(path, data ?? {});
	}

	getExtension(): string {
		return '.ejs';
	}
}
