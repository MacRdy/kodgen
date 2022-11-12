import { Extensions, ICanChangeName, IntegerType, NumberType, StringType } from '../shared.model';

export class EnumEntryDef<T = unknown> {
	constructor(readonly name: string, readonly value: T) {}
}

export type EnumType = IntegerType | NumberType | StringType;

export class EnumDef<T = unknown> implements ICanChangeName {
	get name(): string {
		return this._name;
	}

	private _name: string;

	constructor(
		name: string,
		readonly type: EnumType,
		readonly entries: EnumEntryDef<T>[],
		readonly deprecated: boolean,
		readonly format?: string,
		readonly description?: string,
		readonly extensions?: Extensions,
	) {
		this._name = name;
	}

	setName(name: string): void {
		this._name = name;
	}
}
