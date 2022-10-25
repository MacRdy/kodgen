import { ModelDef } from './model.model';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class PathResponse {
	constructor(readonly code: string, readonly media: string, readonly content: ModelDef) {}
}

export class PathRequestBody {
	constructor(readonly media: string, readonly content: ModelDef) {}
}

export class PathDef {
	constructor(
		readonly url: string,
		readonly method: Method,
		readonly parameters?: ReadonlyArray<ModelDef>,
		readonly requestBody?: ReadonlyArray<PathRequestBody>,
		readonly responses?: ReadonlyArray<PathResponse>,
		readonly tags?: ReadonlyArray<string>,
	) {}
}
