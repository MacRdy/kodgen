import { Extensions, Model } from '../shared.model';

export class PropertyDetails {
	required: boolean;
	readonly: boolean;
	writeonly: boolean;
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor() {
		this.readonly = false;
		this.deprecated = false;
		this.extensions = {};
		this.writeonly = false;
		this.required = false;
	}
}

export class Property extends PropertyDetails {
	constructor(
		public name: string,
		public def: Model,
		details?: Partial<PropertyDetails>,
	) {
		super();

		this.required = details?.required ?? this.required;
		this.readonly = details?.readonly ?? this.readonly;
		this.writeonly = details?.writeonly ?? this.writeonly;
		this.deprecated = details?.deprecated ?? this.deprecated;
		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
	}
}
