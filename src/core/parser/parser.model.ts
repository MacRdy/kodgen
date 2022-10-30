import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';

export interface IParserProviderService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	create(doc: T): IParserService;
}

export interface IParserService {
	parse(): IDocument;
}
