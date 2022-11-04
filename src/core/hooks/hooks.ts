import { HookFn } from './hooks.model';

export class Hooks {
	private static instance?: Hooks;

	static getOrDefault<T extends HookFn>(key: string, defaultFn: T): T {
		if (!this.instance) {
			throw new Error('Hooks not initialized.');
		}

		return this.instance.getOrDefault(key, defaultFn);
	}

	static init(hooksObj?: Record<string, HookFn>): void {
		if (this.instance) {
			throw new Error('Hooks already initialized.');
		}

		const hooks: [string, HookFn][] = [];

		if (hooksObj) {
			for (const [key, hook] of Object.entries(hooksObj)) {
				hooks.push([key, hook]);
			}
		}

		this.instance = new Hooks(hooks);
	}

	static reset(): void {
		this.instance = undefined;
	}

	private readonly hooks: Map<string, HookFn>;

	private constructor(hooks: [string, HookFn][]) {
		this.hooks = new Map<string, HookFn>(hooks);
	}

	getOrDefault<T extends HookFn>(key: string, defaultFn: T): T {
		const fn = this.hooks.get(key);

		if (fn) {
			return ((...args: unknown[]) => fn(defaultFn, ...args)) as T;
		}

		return defaultFn;
	}
}
