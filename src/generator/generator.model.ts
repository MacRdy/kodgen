import { IDocument } from 'src/core/entities/document.model';
import { ResolveFn } from 'src/core/entities/model.model';

export interface IGeneratorFile<T = unknown> {
	path: string;
	template: string;
	data?: T;
}

export interface IGenerator {
	getName(): string;
	generate(doc: IDocument, resolve: ResolveFn): IGeneratorFile[];
}
