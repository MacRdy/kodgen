import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { Extensions, ModelDef } from '../entities/shared.model';
import { Printer } from '../printer/printer';
import { mergeParts } from '../utils';
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

export class DefaultError {
	readonly name = DefaultError.name;
	readonly stack = new Error().stack;

	readonly message: string;

	constructor(message: string, context?: Array<string | undefined>) {
		const scopes = context?.filter(Boolean);

		const formattedScopes = scopes?.length
			? `(${mergeParts(...(scopes as string[]))})`
			: undefined;

		this.message = formattedScopes ? `${message} ${formattedScopes}` : message;
	}
}

export class UnresolvedReferenceError {
	readonly name = UnresolvedReferenceError.name;
	readonly stack = new Error().stack;

	readonly message: string;

	constructor(ref: string) {
		this.message = `Unresolved reference '${ref}'`;
	}
}

export class UnknownTypeError {
	readonly name = UnknownTypeError.name;
	readonly message: string;
	readonly stack = new Error().stack;

	constructor(context: Array<string | undefined>) {
		this.message = new DefaultError('Unknown type', context).message;
	}
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
	error: DefaultError | UnknownTypeError | UnresolvedReferenceError,
): void => {
	Printer.warn(`Warning: ${error.message}`);
};
