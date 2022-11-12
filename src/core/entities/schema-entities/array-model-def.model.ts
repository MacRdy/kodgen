import { Extensions, ModelDef } from '../shared.model';

export class ArrayModelDef {
	constructor(readonly items: ModelDef, readonly extensions: Extensions = {}) {}
}
