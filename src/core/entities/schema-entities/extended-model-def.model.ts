import { ModelDef } from '../shared.model';

export type ExtendedType = 'allOf' | 'oneOf' | 'anyOf';

export class ExtendedModelDef {
	constructor(public type: ExtendedType, public def: ModelDef[]) {}
}
