import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';

export interface IParserService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	parse(doc: T): IDocument;
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
