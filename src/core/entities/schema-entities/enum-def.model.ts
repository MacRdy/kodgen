import {
	Extensions,
	IntegerType,
	IReferenceEntity,
	NumberType,
	REGULAR_OBJECT_ORIGIN,
	StringType,
} from '../shared.model';

export class EnumEntryDef<T = unknown> {
	constructor(readonly name: string, readonly value: T) {}
}

export type EnumType = IntegerType | NumberType | StringType;

export class EnumDef<T = unknown> implements IReferenceEntity {
	get name(): string {
		return this._name;
	}

	private _name: string;

	private origin: string;
	private autoName: boolean;

	constructor(
		name: string,
		readonly type: EnumType,
		readonly entries: EnumEntryDef<T>[],
		readonly deprecated: boolean = false,
		readonly format?: string,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {
		this._name = name;

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
}
