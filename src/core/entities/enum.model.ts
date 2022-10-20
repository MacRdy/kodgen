export interface IEnum<T = unknown> {
	name: string;
	values: Record<string, T>;
}
