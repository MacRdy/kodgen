import {
	IntegerType,
	IntegerTypeFormat,
	NumberType,
	NumberTypeFormat,
	StringType,
	StringTypeFormat,
} from '../parser.model';
import { ReferenceDef } from './ref.model';

export class EnumEntryDef<T = unknown> {
	constructor(readonly name: string, readonly value: T) {}
}

export type EnumType = IntegerType | NumberType | StringType;
export type EnumTypeFormat = IntegerTypeFormat | NumberTypeFormat | StringTypeFormat;

export class EnumDef<T = unknown> {
	readonly ref = new ReferenceDef();

	constructor(
		readonly name: string,
		readonly type: EnumType,
		readonly entries: EnumEntryDef<T>[],
		readonly format?: EnumTypeFormat,
	) {}
}
