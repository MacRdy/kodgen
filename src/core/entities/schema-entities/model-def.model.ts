import { Extensions, ICanChangeName } from '../shared.model';
import { Property } from './property.model';

// TODO review naming ModelDef suffix
export class ObjectModelDef implements ICanChangeName {
	get name(): string {
		return this._name;
	}

	private _name: string;

	get properties(): readonly Property[] {
		return this._properties;
	}

	private _properties: readonly Property[];

	constructor(
		name: string,
		properties: readonly Property[] = [],
		readonly extensions: Extensions = {},
		readonly deprecated = false,
		readonly description?: string,
	) {
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
