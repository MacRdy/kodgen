import { Extensions } from '../shared.model';

export class SimpleModelDef {
	constructor(
		readonly type: string,
		readonly format?: string,
		readonly extensions: Extensions = {},
	) {}
}
