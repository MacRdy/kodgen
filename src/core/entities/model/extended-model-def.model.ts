import { Extensions, ModelDef } from '../shared.model';

export type ExtendedModelType = 'and' | 'or';

export interface ExtendedModelDefDetails {
	description?: string;
	extensions?: Extensions;
}

export class ExtendedModelDef {
	description?: string;
	extensions: Extensions;

	constructor(
		public type: ExtendedModelType,
		public def: ModelDef[],
		details?: ExtendedModelDefDetails,
	) {
		this.description = details?.description;
		this.extensions = details?.extensions ?? {};
	}
}
