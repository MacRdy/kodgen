import { IDocument } from '../core/entities/document.model';
import { ResolveFn } from '../core/entities/model.model';
import { TemplateData } from '../core/renderer/renderer.model';

export interface IGeneratorFile {
	path: string;
	templateFolder: string;
	templateName: string;
	templateData?: TemplateData;
}

export interface IGenerator {
	getName(): string;
	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[];
}
