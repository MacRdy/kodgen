import { Extensions, ModelDef } from '../shared.model';

export type ExtendedModelType = 'and' | 'or';

export class ExtendedModelDefDetails {
	description?: string;
	extensions: Extensions;

	constructor() {
		this.extensions = {};
	}
}

export class ExtendedModelDef extends ExtendedModelDefDetails {
	constructor(
		public type: ExtendedModelType,
		public def: ModelDef[],
		details?: Partial<ExtendedModelDefDetails>,
	) {
		super();

		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
	}
}
