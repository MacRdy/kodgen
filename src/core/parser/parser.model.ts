import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { Printer } from '../../core/print/printer';
import { IDocument } from '../entities/document.model';
import { Extensions, SchemaEntity } from '../entities/shared.model';

export interface IParserService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	parse(doc: T): IDocument;
}

export interface IParseSchemaData {
	name?: string;
	origin?: string;
	originalName?: boolean;
}

export type ParseSchemaEntityFn<T> = (obj: T, data?: IParseSchemaData) => SchemaEntity;

export class UnresolvedReferenceError {
	readonly name = UnresolvedReferenceError.name;
	readonly message = 'Unresolved reference.';
	readonly stack = new Error().stack;
}

export class UnknownTypeError {
	readonly name = UnknownTypeError.name;
	readonly message = 'Unknown type.';
	readonly stack = new Error().stack;
}

export class TrivialError {
	readonly name = TrivialError.name;
	readonly stack = new Error().stack;

	constructor(readonly message: string) {}
}

export const isOpenApiReferenceObject = (
	obj: unknown,
): obj is OpenAPIV2.ReferenceObject | OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject =>
	!!obj &&
	Object.prototype.hasOwnProperty.call<unknown, [keyof OpenAPIV3.ReferenceObject], boolean>(
		obj,
		'$ref',
	);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getExtensions = (schema: Record<string, any>): Extensions => {
	const re = /^x-/;

	const extensions: Extensions = {};

	for (const [key, value] of Object.entries(schema)) {
		if (re.test(key)) {
			extensions[key] = value;
		}
	}

	return extensions;
};

export const schemaWarning = (
	scope: Array<string | undefined>,
	e: unknown,
	defaultMessage = 'Unsupported schema',
): void => {
	const scopes = scope.filter(Boolean).join(' ');
	const scopeBlock = scopes ? ` (${scopes})` : '';

	const errorMessage =
		e instanceof Error || e instanceof TrivialError || e instanceof UnresolvedReferenceError
			? e.message || defaultMessage
			: defaultMessage;

	Printer.warn(`Warning${scopeBlock}: ${errorMessage}`);
};
