import { Extensions, IReferenceEntity, REGULAR_OBJECT_ORIGIN } from '../shared.model';
import { Property } from './property.model';

export class ObjectModelDef implements IReferenceEntity {
	get name(): string {
		return this._name;
	}

	private _name: string;

	get properties(): readonly Property[] {
		return this._properties;
	}

	private _properties: readonly Property[];

	private origin: string;
	private autoName: boolean;

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
		this.autoName = false;
	}

	isAutoName(): boolean {
		return this.autoName;
	}

	setOrigin(origin: string, isAutoName: boolean): void {
		this.origin = origin;
		this.autoName = isAutoName;
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
