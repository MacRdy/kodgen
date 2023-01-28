import { loadFile } from '../utils';

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

export const loadHooksFile = async (path?: string): Promise<IHook[]> => {
	const hooks: IHook[] = [];

	const hooksObj = await loadFile<Record<string, HookFn>>(path, 'Hooks file not found');

	if (hooksObj) {
		for (const [name, fn] of Object.entries(hooksObj)) {
			hooks.push({ name, fn });
		}
	}

	return hooks;
};
