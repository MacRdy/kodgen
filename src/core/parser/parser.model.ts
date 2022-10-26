import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { ResolveFn } from '../entities/model.model';

export interface IParserProviderService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	create(doc: T): IParserService;
}

export interface IParserService {
	readonly resolve: ResolveFn;
	parse(): IDocument;
}
