export class SimpleModelDefDetails {
	format?: string;
}

export class SimpleModelDef extends SimpleModelDefDetails {
	constructor(public type: string, details?: Partial<SimpleModelDefDetails>) {
		super();

		this.format = details?.format;
	}
}
