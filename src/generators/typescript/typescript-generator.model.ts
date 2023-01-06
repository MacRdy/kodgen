import { PathMethod } from '../../core/entities/schema-entities/path-def.model';
import { Extensions } from '../../core/entities/shared.model';

export interface ITsGeneratorConfig {
	inlinePathParameters?: boolean;
	inlineQueryParameters?: boolean;
}

export interface ITsGeneratorParameters {
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

export interface ITsEnumEntry<T = unknown> {
	name: string;
	value: T;
	deprecated: boolean;
	description?: string;
	extensions?: Extensions;
}

export interface ITsEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: ITsEnumEntry[];
	deprecated: boolean;
	extensions?: Extensions;
	description?: string;
}

export interface ITsModelProperty {
	name: string;
	type: string;
	required: boolean;
	deprecated: boolean;
	dependencies: string[];
	description?: string;
	extensions: Extensions;
}

export interface ITsModel {
	name: string;
	properties: ITsModelProperty[];
	additionPropertiesTypeName?: string;
	deprecated: boolean;
	description?: string;
	dependencies: string[];
}

export interface ITsPropertyMapping {
	originalName: string;
	objectPath: string[];
}

export interface ITsPathRequestBody {
	typeName: string;
	multipart: boolean;
}

export interface ITsPathBody {
	typeName: string;
	media: string;
	dependencies: string[];
}

export interface ITsPathRequest {
	pathParametersType?: ITsModel;
	queryParametersType?: ITsModel;
	queryParametersMapping?: ITsPropertyMapping[];
	body?: ITsPathBody;
}

export interface ITsPathResponse {
	typeName: string;
	media?: string;
	dependencies: string[];
	description?: string;
}

export interface ITsPath {
	name: string;
	urlPattern: string;
	method: PathMethod;
	request: ITsPathRequest;
	response: ITsPathResponse;
	deprecated: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions: Extensions;
	security: Record<string, string[]>[];
}

export interface ITsStorageInfo<T> {
	name?: string;
	generatedModel?: T;
	mapping?: ITsPropertyMapping[];
}

export type TsGenerateName = (...parts: string[]) => string;

export type TsResolveSimpleType = (type: string, format?: string) => string | undefined;
