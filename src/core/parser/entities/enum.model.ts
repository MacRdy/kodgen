import {
	IntegerType,
	IntegerTypeFormat,
	NumberType,
	NumberTypeFormat,
	StringType,
	StringTypeFormat,
} from '../parser.model';

export interface IEnumEntry<T = unknown> {
	name: string;
	value: T;
}

export type EnumType = IntegerType | NumberType | StringType;
export type EnumTypeFormat = IntegerTypeFormat | NumberTypeFormat | StringTypeFormat;

export interface IEnum<T = unknown> {
	name: string;
	type: EnumType;
	entries: IEnumEntry<T>[];
	format?: EnumTypeFormat;
}
