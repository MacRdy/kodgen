import { IHasDescription } from '../description.model';
import { Model } from '../shared.model';

export class ArrayModelDetails implements IHasDescription {
	description?: string;
}

export class ArrayModel extends ArrayModelDetails {
	constructor(
		public items: Model,
		details?: Partial<ArrayModelDetails>,
	) {
		super();

		this.description = details?.description;
	}
}
