export interface IEnumEntry<T = unknown> {
	name: string;
	value: T;
}

export type EnumType = 'integer' | 'number' | 'string';

export interface IEnum<T = unknown> {
	name: string;
	type: EnumType;
	entries: IEnumEntry<T>[];
}
