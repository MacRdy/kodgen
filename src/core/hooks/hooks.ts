import { AnyFn, HookFn, IHook } from './hooks.model';

export class Hooks {
	private static instance?: Hooks;

	static getOrDefault<T extends AnyFn>(key: string, defaultFn: T): T {
		if (!this.instance) {
			throw new Error('Hooks not initialized');
		}

		return this.instance.getOrDefault(key, defaultFn);
	}

	static init(hooks: IHook[]): void {
		if (this.instance) {
			throw new Error('Hooks already initialized');
		}

		this.instance = new Hooks(hooks);
	}

	static reset(): void {
		this.instance = undefined;
	}

	private readonly hooks: Map<string, HookFn>;

	private constructor(hooks: IHook[]) {
		this.hooks = new Map<string, HookFn>(hooks.map(x => [x.name, x.fn]));
	}

	getOrDefault<T extends AnyFn>(key: string, defaultFn: T): T {
		const fn = this.hooks.get(key);

		if (fn) {
			return ((...args: unknown[]) => fn(defaultFn, ...args)) as T;
		}

		return defaultFn;
	}
}
