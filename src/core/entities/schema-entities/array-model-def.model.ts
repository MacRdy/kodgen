import { Extensions, SchemaEntity } from '../shared.model';

export class ArrayModelDef {
	constructor(readonly items: SchemaEntity, readonly extensions: Extensions = {}) {}
}
