import { Extensions, SchemaEntity } from '../shared.model';

export interface IPropertyAdditional {
	required?: boolean;
	nullable?: boolean;
	readonly?: boolean;
	writeonly?: boolean;
	deprecated?: boolean;
	description?: string;
	extensions?: Extensions;
}

export class Property {
	required: boolean;
	nullable: boolean;
	readonly: boolean;
	writeonly: boolean;
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor(public name: string, public def: SchemaEntity, additional?: IPropertyAdditional) {
		this.required = additional?.required ?? false;
		this.nullable = additional?.nullable ?? false;
		this.readonly = additional?.readonly ?? false;
		this.writeonly = additional?.writeonly ?? false;
		this.deprecated = additional?.deprecated ?? false;
		this.description = additional?.description;
		this.extensions = additional?.extensions ?? {};
	}
}
