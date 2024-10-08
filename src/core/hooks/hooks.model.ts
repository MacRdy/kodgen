// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFn = (...args: any[]) => any;

export type HookFn<T extends AnyFn = AnyFn> = (
	defaultFn: T,
	...args: Parameters<T>
) => ReturnType<T>;

export interface IHook {
	name: string;
	fn: HookFn;
}
