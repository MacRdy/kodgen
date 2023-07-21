export interface ISimpleModelDefDetails {
	format?: string;
}

export class SimpleModelDef {
	format?: string;

	constructor(public type: string, details?: ISimpleModelDefDetails) {
		this.format = details?.format;
	}
}
