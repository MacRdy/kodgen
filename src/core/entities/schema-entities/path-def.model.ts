import { Extensions, SchemaEntity } from '../shared.model';
import { ObjectModelDef } from './model-def.model';

export type PathMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'TRACE' | 'PATCH' | 'HEAD';

export class PathParametersObjectModelDef extends ObjectModelDef {
	readonly pathObjectType = 'PathParameters';
}
export class QueryParametersObjectModelDef extends ObjectModelDef {
	readonly pathObjectType = 'QueryParameters';
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
		readonly requestPathParameters?: ObjectModelDef,
		readonly requestQueryParameters?: ObjectModelDef,
		readonly requestBody?: readonly PathRequestBody[],
		readonly responses?: readonly PathResponse[],
		readonly tags?: readonly string[],
		readonly extensions?: Extensions,
	) {}
}
