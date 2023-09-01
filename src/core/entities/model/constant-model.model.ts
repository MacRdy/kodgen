export class ConstantModelDetails {
	format?: string;
}

export class ConstantModel extends ConstantModelDetails {
	constructor(
		public value: string | number,
		details?: Partial<ConstantModelDetails>,
	) {
		super();

		this.format = details?.format;
	}
}
