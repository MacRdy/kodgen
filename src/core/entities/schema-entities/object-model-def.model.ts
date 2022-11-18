import { Extensions, ICanChangeName } from '../shared.model';
import { Property } from './property.model';

export const REGULAR_OBJECT_ORIGIN = 'REGULAR_OBJECT_ORIGIN';

export class ObjectModelDef implements ICanChangeName {
	get name(): string {
		return this._name;
	}

	private _name: string;

	get properties(): readonly Property[] {
		return this._properties;
	}

	private _properties: readonly Property[];

	private origin: string;
	private autogeneratedName: boolean;

	constructor(
		name: string,
		properties: readonly Property[] = [],
		readonly deprecated = false,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {
		this._name = name;
		this._properties = properties;

		this.origin = REGULAR_OBJECT_ORIGIN;
		this.autogeneratedName = false;
	}

	isAutogeneratedName(): boolean {
		return this.autogeneratedName;
	}

	setOrigin(origin: string, autogeneratedName: boolean): void {
		this.origin = origin;
		this.autogeneratedName = autogeneratedName;
	}

	getOrigin(): string {
		return this.origin;
	}

	setName(name: string): void {
		this._name = name;
	}

	setProperties(properties: Property[]): void {
		this._properties = properties;
	}
}
