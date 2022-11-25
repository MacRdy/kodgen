import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';

export interface IParserProviderService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	create(doc: T): IParserService;
}

export interface IParserService {
	parse(): IDocument;
}

export class UnresolvedReferenceError extends Error {
	constructor() {
		super('Unresolved reference.');
		this.name = UnresolvedReferenceError.name;
	}
}

export class TrivialError extends Error {
	constructor(message: string) {
		super(message);
		this.name = TrivialError.name;
	}
}
