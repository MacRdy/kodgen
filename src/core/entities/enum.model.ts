import { IReferable, Reference } from './reference.model';
import {
	ICanChangeName,
	IntegerType,
	IntegerTypeFormat,
	NumberType,
	NumberTypeFormat,
	StringType,
	StringTypeFormat,
} from './shared.model';

export class EnumEntryDef<T = unknown> {
	constructor(readonly name: string, readonly value: T) {}
}

export type EnumType = IntegerType | NumberType | StringType;
export type EnumTypeFormat = IntegerTypeFormat | NumberTypeFormat | StringTypeFormat;

export class EnumDef<T = unknown> implements IReferable, ICanChangeName {
	readonly ref = new Reference();

	get name(): string {
		return this._name;
	}

	private _name: string;

	constructor(
		name: string,
		readonly type: EnumType,
		readonly entries: EnumEntryDef<T>[],
		readonly format?: EnumTypeFormat,
	) {
		this._name = name;
	}

	setName(name: string): void {
		this._name = name;
	}
}
