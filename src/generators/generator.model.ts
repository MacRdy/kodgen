import { IDocument } from '../core/entities/document.model';
import { TemplateData } from '../core/renderer/renderer.model';

export interface IGeneratorFile {
	path: string;
	templatePath: string;
	templateData?: TemplateData;
}

export interface IGenerator {
	getName(): string;
	getTemplateDir(): string;
	generate(doc: IDocument): IGeneratorFile[];
}
