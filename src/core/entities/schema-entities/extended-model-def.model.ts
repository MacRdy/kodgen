import { Extensions, ModelDef } from '../shared.model';

export type ExtendedModelType = 'and' | 'or';

export interface ExtendedModelDefAdditional {
	extensions?: Extensions;
}

export class ExtendedModelDef {
	extensions: Extensions;

	constructor(
		public type: ExtendedModelType,
		public def: ModelDef[],
		additional?: ExtendedModelDefAdditional,
	) {
		this.extensions = additional?.extensions ?? {};
	}
}
