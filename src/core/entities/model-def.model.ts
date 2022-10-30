import { Property } from './property.model';

export class ObjectModelDef {
	get name(): string {
		return this._name;
	}

	private _name: string;

	get properties(): ReadonlyArray<Property> {
		return this._properties;
	}

	private _properties: ReadonlyArray<Property>;

	constructor(name: string, properties?: ReadonlyArray<Property>) {
		this._name = name;
		this._properties = properties ?? [];
	}

	setName(name: string): void {
		this._name = name;
	}

	setProperties(properties: Property[]): void {
		this._properties = properties;
	}
}
