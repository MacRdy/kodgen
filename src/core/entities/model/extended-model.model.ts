import { IHasDescription } from '../description.model';
import { Extensions, Model } from '../shared.model';

export type ExtendedModelType = 'and' | 'or';

export class ExtendedModelDetails implements IHasDescription {
	description?: string;
	extensions: Extensions;

	constructor() {
		this.extensions = {};
	}
}

export class ExtendedModel extends ExtendedModelDetails {
	constructor(
		public type: ExtendedModelType,
		public def: Model[],
		details?: Partial<ExtendedModelDetails>,
	) {
		super();

		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
	}
}
