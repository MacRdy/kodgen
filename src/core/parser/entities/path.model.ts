import { ModelDef } from './model.model';

export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class PathDef {
	constructor(
		readonly url: string,
		readonly method: Method,
		readonly parameters?: ReadonlyArray<ModelDef>,
		readonly requestBody?: ModelDef,
		readonly response?: ModelDef,
	) {}
}
