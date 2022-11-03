import { HookFn } from './hooks.model';

export class Hooks {
	private static instance?: Hooks;

	static getInstance(): Hooks {
		if (!this.instance) {
			throw new Error('Hooks not initialized.');
		}

		return this.instance;
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

	private constructor(hooks: [string, HookFn][]) {
		this.hooks = new Map<string, HookFn>(hooks);
	}

	private readonly hooks: Map<string, HookFn>;

	has(key: string): boolean {
		return this.hooks.has(key);
	}

	getOrDefault<T extends HookFn>(key: string, defaultFn: T): T {
		const fn = this.hooks.get(key);

		if (fn) {
			return ((...args: unknown[]) => fn(defaultFn, ...args)) as T;
		}

		return defaultFn;
	}
}
