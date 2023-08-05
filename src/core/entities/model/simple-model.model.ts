export class SimpleModelDetails {
	format?: string;
}

export class SimpleModel extends SimpleModelDetails {
	constructor(
		public type: string,
		details?: Partial<SimpleModelDetails>,
	) {
		super();

		this.format = details?.format;
	}
}
