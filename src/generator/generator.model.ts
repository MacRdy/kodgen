import { IDocument } from '../core/entities/document.model';
import { TemplateData } from '../core/renderer/renderer.model';

export interface IGeneratorFile {
	path: string;
	templateUrl: string;
	templateData?: TemplateData;
}

export interface IGenerator {
	getName(): string;
	getTemplateFolder(): string;
	generate(doc: IDocument): IGeneratorFile[];
}
