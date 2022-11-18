import { Extensions, SchemaEntity } from '../shared.model';
import { ObjectModelDef } from './object-model-def.model';

export type PathMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | 'HEAD';

export const PATH_PARAMETERS_OBJECT_ORIGIN = 'PATH_PARAMETERS_OBJECT_ORIGIN';
export const QUERY_PARAMETERS_OBJECT_ORIGIN = 'QUERY_PARAMETERS_OBJECT_ORIGIN';
export const BODY_OBJECT_ORIGIN = 'BODY_OBJECT_ORIGIN';
export const RESPONSE_OBJECT_ORIGIN = 'RESPONSE_OBJECT_ORIGIN';

export class PathResponse {
	constructor(readonly code: string, readonly media: string, readonly content: SchemaEntity) {}
}

export class PathRequestBody {
	constructor(readonly media: string, readonly content: SchemaEntity) {}
}

export class PathDef {
	constructor(
		readonly urlPattern: string,
		readonly method: PathMethod,
		readonly requestPathParameters?: ObjectModelDef,
		readonly requestQueryParameters?: ObjectModelDef,
		readonly requestBody?: readonly PathRequestBody[],
		readonly responses?: readonly PathResponse[],
		readonly tags?: readonly string[],
		readonly deprecated = false,
		readonly summaries?: string[],
		readonly descriptions?: string[],
		readonly extensions: Extensions = {},
	) {}
}
