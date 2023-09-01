import { IHasDescription } from '../description.model';

export class SimpleModelDetails implements IHasDescription {
	format?: string;
	description?: string;
}

export class SimpleModel extends SimpleModelDetails {
	constructor(
		public type: string,
		details?: Partial<SimpleModelDetails>,
	) {
		super();

		this.format = details?.format;
		this.description = details?.description;
	}
}
