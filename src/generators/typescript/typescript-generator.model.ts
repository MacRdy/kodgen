import { PathMethod } from '../../core/entities/schema-entities/path-def.model';
import { Extensions } from '../../core/entities/shared.model';

export interface ITsGenConfig {
	index?: boolean;
	inlinePathParameters?: boolean;
	inlineQueryParameters?: boolean;
	readonly?: boolean;
}

export interface ITsGenParameters {
	enumDir: string;
	enumFileNameResolver: (name: string) => string;
	enumTemplate: string;

	modelDir: string;
	modelFileNameResolver: (name: string) => string;
	modelTemplate: string;

	pathDir: string;
	pathFileNameResolver: (name: string) => string;
	pathTemplate: string;
}

export interface ITsGenEnumEntry<T = unknown> {
	name: string;
	value: T;
	deprecated: boolean;
	description?: string;
	extensions?: Extensions;
}

export interface ITsGenEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: ITsGenEnumEntry[];
	deprecated: boolean;
	extensions?: Extensions;
	description?: string;
}

export interface ITsGenModelProperty {
	name: string;
	type: string;
	required: boolean;
	deprecated: boolean;
	dependencies: string[];
	description?: string;
	extensions: Extensions;
}

export interface ITsGenModel {
	name: string;
	properties: ITsGenModelProperty[];
	additionPropertiesTypeName?: string;
	deprecated: boolean;
	description?: string;
	dependencies: string[];
}

export interface ITsGenPropertyMapping {
	originalName: string;
	objectPath: string[];
}

export interface ITsGenPathRequestBody {
	typeName: string;
	multipart: boolean;
}

export interface ITsPathBody {
	typeName: string;
	media: string;
	dependencies: string[];
}

export interface ITsGenPathRequest {
	pathParametersType?: ITsGenModel;
	queryParametersType?: ITsGenModel;
	queryParametersMapping?: ITsGenPropertyMapping[];
	body?: ITsPathBody;
}

export interface ITsGenPathResponse {
	typeName: string;
	media?: string;
	dependencies: string[];
	description?: string;
}

export interface ITsGenPath {
	name: string;
	urlPattern: string;
	method: PathMethod;
	request: ITsGenPathRequest;
	response: ITsGenPathResponse;
	deprecated: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions: Extensions;
	security: Record<string, string[]>[];
}

export interface ITsGenStorageInfo<T> {
	name?: string;
	generatedModel?: T;
	mapping?: ITsGenPropertyMapping[];
}

export type TsGenGenerateName = (...parts: string[]) => string;

export type TsGenGenerateMethodName = (name: string, modifier?: number) => string;

export type TsGenResolveSimpleType = (type: string, format?: string) => string | undefined;
