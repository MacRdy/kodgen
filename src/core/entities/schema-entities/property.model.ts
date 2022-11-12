import { SchemaEntity } from '../shared.model';

export class Property {
	constructor(
		readonly name: string,
		readonly def: SchemaEntity,
		readonly required: boolean,
		readonly nullable: boolean,
		readonly readonly: boolean,
		readonly writeonly: boolean,
		readonly deprecated: boolean,
		readonly description?: string,
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
