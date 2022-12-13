import { ModelDef } from '../shared.model';

export type ExtendedType = 'and' | 'or';

export class ExtendedModelDef {
	constructor(public type: ExtendedType, public def: ModelDef[]) {}
}
