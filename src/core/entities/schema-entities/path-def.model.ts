import { Extensions, SchemaEntity } from '../shared.model';
import { ObjectModelDef } from './object-model-def.model';

export type PathMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | 'HEAD';

export const PATH_PARAMETERS_OBJECT_ORIGIN = 'PATH_PARAMETERS_OBJECT_ORIGIN';
export const QUERY_PARAMETERS_OBJECT_ORIGIN = 'QUERY_PARAMETERS_OBJECT_ORIGIN';
export const FORM_DATA_OBJECT_ORIGIN = 'FORM_DATA_OBJECT_ORIGIN';
export const BODY_OBJECT_ORIGIN = 'BODY_OBJECT_ORIGIN';
export const RESPONSE_OBJECT_ORIGIN = 'RESPONSE_OBJECT_ORIGIN';

export type PathDefSecurity = Record<string, string[]>[];

export class PathResponse {
	constructor(readonly code: string, readonly media: string, readonly content: SchemaEntity) {}
}

export class PathRequestBody {
	constructor(readonly media: string, readonly content: SchemaEntity) {}
}

export interface IPathDefAdditional {
	requestPathParameters?: ObjectModelDef;
	requestQueryParameters?: ObjectModelDef;
	requestBody?: PathRequestBody[];
	responses?: PathResponse[];
	tags?: string[];
	deprecated?: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions?: Extensions;
	security?: PathDefSecurity;
}

export class PathDef {
	requestPathParameters?: ObjectModelDef;
	requestQueryParameters?: ObjectModelDef;
	requestBody?: PathRequestBody[];
	responses?: PathResponse[];
	tags?: string[];
	deprecated: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions: Extensions;
	security: PathDefSecurity;

	constructor(
		public urlPattern: string,
		public method: PathMethod,
		additional?: IPathDefAdditional,
	) {
		this.requestPathParameters = additional?.requestPathParameters;
		this.requestQueryParameters = additional?.requestQueryParameters;
		this.requestBody = additional?.requestBody;
		this.responses = additional?.responses;
		this.tags = additional?.tags;
		this.deprecated = additional?.deprecated ?? false;
		this.summaries = additional?.summaries;
		this.descriptions = additional?.descriptions;
		this.extensions = additional?.extensions ?? {};
		this.security = additional?.security ?? [];
	}
}
