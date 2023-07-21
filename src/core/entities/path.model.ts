import { ObjectModelDef } from './model/object-model-def.model';
import { Extensions, ModelDef } from './shared.model';

export type PathMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | 'HEAD';

export const PATH_PARAMETERS_OBJECT_ORIGIN = 'PATH_PARAMETERS_OBJECT_ORIGIN';
export const QUERY_PARAMETERS_OBJECT_ORIGIN = 'QUERY_PARAMETERS_OBJECT_ORIGIN';
export const FORM_DATA_OBJECT_ORIGIN = 'FORM_DATA_OBJECT_ORIGIN';
export const BODY_OBJECT_ORIGIN = 'BODY_OBJECT_ORIGIN';
export const RESPONSE_OBJECT_ORIGIN = 'RESPONSE_OBJECT_ORIGIN';

export type PathSecurity = Record<string, string[]>[];

export class PathResponse {
	constructor(readonly code: string, readonly media: string, readonly content: ModelDef) {}
}

export class PathRequestBodyDetails {
	required: boolean;
	description?: string;

	constructor() {
		this.required = false;
	}
}

export class PathRequestBody extends PathRequestBodyDetails {
	constructor(
		readonly media: string,
		readonly content: ModelDef,
		details?: Partial<PathRequestBodyDetails>,
	) {
		super();

		this.required = details?.required ?? this.required;
		this.description = details?.description;
	}
}

export class PathDetails {
	operationId?: string;
	requestPathParameters?: ObjectModelDef;
	requestQueryParameters?: ObjectModelDef;
	requestBodies?: PathRequestBody[];
	responses?: PathResponse[];
	tags?: string[];
	deprecated: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions: Extensions;
	security: PathSecurity;

	constructor() {
		this.deprecated = false;
		this.extensions = {};
		this.security = [];
	}
}

export class Path extends PathDetails {
	constructor(
		public urlPattern: string,
		public method: PathMethod,
		details?: Partial<PathDetails>,
	) {
		super();

		this.operationId = details?.operationId;
		this.requestPathParameters = details?.requestPathParameters;
		this.requestQueryParameters = details?.requestQueryParameters;
		this.requestBodies = details?.requestBodies;
		this.responses = details?.responses;
		this.tags = details?.tags;
		this.deprecated = details?.deprecated ?? this.deprecated;
		this.summaries = details?.summaries;
		this.descriptions = details?.descriptions;
		this.extensions = details?.extensions ?? this.extensions;
		this.security = details?.security ?? this.security;
	}
}
