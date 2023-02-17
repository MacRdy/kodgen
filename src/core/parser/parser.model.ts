import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { Extensions, ModelDef } from '../entities/shared.model';
import { Printer } from '../printer/printer';
import { ICommonParserConfig } from './common/common-parser.model';

export type ParserConfig = ICommonParserConfig;

export interface IParserService<T = unknown> {
	isSupported(definition: OpenAPI.Document): boolean;
	validate(definition: T): Promise<void>;
	parse(doc: T, config?: ParserConfig): IDocument;
}

export interface IParseSchemaData {
	name?: string;
	origin?: string;
	originalName?: boolean;
}

export type ParseSchemaEntityFn<T> = (obj: T, data?: IParseSchemaData) => ModelDef;

export class UnresolvedReferenceError {
	readonly name = UnresolvedReferenceError.name;
	readonly stack = new Error().stack;

	readonly message: string;

	constructor(ref: string) {
		this.message = `Unresolved reference. Ref: '${ref}'`;
	}
}

export class UnknownTypeError {
	readonly name = UnknownTypeError.name;
	readonly message = 'Unknown type';
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
	context: Array<string | undefined>,
	error: unknown,
	defaultMessage = 'Unsupported schema',
): void => {
	const scopes = context.filter(Boolean).join(' ');
	const scopeBlock = scopes ? ` (${scopes})` : '';

	let errorMessage: string = defaultMessage;

	if (typeof error === 'string') {
		errorMessage = error || defaultMessage;
	} else if (
		error instanceof Error ||
		error instanceof TrivialError ||
		error instanceof UnknownTypeError ||
		error instanceof UnresolvedReferenceError
	) {
		errorMessage = error.message || defaultMessage;
	}

	Printer.warn(`Warning${scopeBlock}: ${errorMessage}`);
};
