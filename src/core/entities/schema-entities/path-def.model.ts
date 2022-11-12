import { Extensions, SchemaEntity } from '../shared.model';
import { ObjectModelDef } from './model-def.model';

export type PathMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | 'HEAD';

export class PathParametersObjectModelDef extends ObjectModelDef {
	readonly pathObjectType = 'PathParametersObject';
}
export class QueryParametersObjectModelDef extends ObjectModelDef {
	readonly pathObjectType = 'QueryParametersObject';
}

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
		readonly requestPathParameters?: PathParametersObjectModelDef,
		readonly requestQueryParameters?: QueryParametersObjectModelDef,
		readonly requestBody?: readonly PathRequestBody[],
		readonly responses?: readonly PathResponse[],
		readonly tags?: readonly string[],
		readonly deprecated = false,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {}
}
