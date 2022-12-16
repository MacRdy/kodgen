import { ModelDef } from '../shared.model';

export type ExtendedModelType = 'and' | 'or';

export class ExtendedModelDef {
	constructor(public type: ExtendedModelType, public def: ModelDef[]) {}
}
