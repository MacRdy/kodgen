import { Extensions, SchemaEntity } from '../shared.model';

export class Property {
	get name(): string {
		return this._name;
	}

	private _name: string;

	constructor(
		name: string,
		readonly def: SchemaEntity,
		readonly required: boolean = false,
		readonly nullable: boolean = false,
		readonly readonly: boolean = false,
		readonly writeonly: boolean = false,
		readonly deprecated: boolean = false,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {
		this._name = name;
	}

	setName(name: string): void {
		this._name = name;
	}

	// TODO setName
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
