import { Extensions, SchemaEntity } from '../shared.model';

export class Property {
	constructor(
		readonly name: string,
		readonly def: SchemaEntity,
		readonly required: boolean = false,
		readonly nullable: boolean = false,
		readonly readonly: boolean = false,
		readonly writeonly: boolean = false,
		readonly deprecated: boolean = false,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {}

	clone(name?: string): Property {
		return new Property(
			name ?? this.name,
			this.def,
			this.required,
			this.nullable,
			this.readonly,
			this.writeonly,
			this.deprecated,
			this.description,
		);
	}
}
