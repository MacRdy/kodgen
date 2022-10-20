import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';

export interface IParserService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	parse(doc: T): IDocument;
}
