import { ObjectModelDef } from './model.model';
import { SchemaEntity } from './shared.model';

export type PathMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

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
		readonly requestBody?: ReadonlyArray<PathRequestBody>,
		readonly responses?: ReadonlyArray<PathResponse>,
		readonly tags?: ReadonlyArray<string>,
	) {}
}
