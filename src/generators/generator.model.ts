import { IDocument } from '../core/entities/document.model';
import { TemplateData } from '../core/renderer/renderer.model';

export interface IGeneratorConfig {
	readonly output: string;
	readonly clean?: boolean;
	readonly templateDir?: string;
	readonly templateDataFile?: string;
	readonly skipTemplates?: readonly string[];
}

export interface IGeneratorFile {
	path: string;
	template: string;
	templateData?: TemplateData;
}

export interface IGenerator<T = unknown> {
	getName(): string;
	getTemplateDir(): string;
	generate(doc: IDocument, config?: T): IGeneratorFile[];
	prepareConfig?(userConfig?: T): T;
}
