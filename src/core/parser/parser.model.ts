import { Extensions } from 'core/entities/shared.model';
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
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

export const isOpenApiReferenceObject = (
	obj: unknown,
): obj is OpenAPIV2.ReferenceObject | OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject =>
	Object.prototype.hasOwnProperty.call<unknown, [keyof OpenAPIV3.ReferenceObject], boolean>(
		obj,
		'$ref',
	);

export const getExtensions = (
	schema: OpenAPIV3.SchemaObject | OpenAPIV3.PathItemObject | OpenAPIV3.OperationObject,
): Extensions => {
	const re = /^x-/;

	const extensions: Extensions = {};

	for (const [key, value] of Object.entries(schema)) {
		if (re.test(key)) {
			extensions[key] = value;
		}
	}

	return extensions;
};
