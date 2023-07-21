import { Extensions, ModelDef } from '../shared.model';

export interface IPropertyDetails {
	required?: boolean;
	readonly?: boolean;
	writeonly?: boolean;
	deprecated?: boolean;
	description?: string;
	extensions?: Extensions;
}

export class Property {
	required: boolean;
	readonly: boolean;
	writeonly: boolean;
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor(public name: string, public def: ModelDef, details?: IPropertyDetails) {
		this.required = details?.required ?? false;
		this.readonly = details?.readonly ?? false;
		this.writeonly = details?.writeonly ?? false;
		this.deprecated = details?.deprecated ?? false;
		this.description = details?.description;
		this.extensions = details?.extensions ?? {};
	}
}
