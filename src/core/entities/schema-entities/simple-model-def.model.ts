export interface ISimpleModelDefAdditional {
	format?: string;
}

export class SimpleModelDef {
	format?: string;

	constructor(public type: string, additional?: ISimpleModelDefAdditional) {
		this.format = additional?.format;
	}
}
