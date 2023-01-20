import { Extensions, ModelDef } from '../shared.model';

export type ExtendedModelType = 'and' | 'or';

export interface ExtendedModelDefAdditional {
	description?: string;
	extensions?: Extensions;
}

export class ExtendedModelDef {
	description?: string;
	extensions: Extensions;

	constructor(
		public type: ExtendedModelType,
		public def: ModelDef[],
		additional?: ExtendedModelDefAdditional,
	) {
		this.description = additional?.description;
		this.extensions = additional?.extensions ?? {};
	}
}
