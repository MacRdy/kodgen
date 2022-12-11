import { FileService } from '../file/file.service';
import { AnyFn, HookFn } from './hooks.model';

export class Hooks {
	private static instance?: Hooks;

	static getOrDefault<T extends AnyFn>(key: string, defaultFn: T): T {
		if (!this.instance) {
			throw new Error('Hooks not initialized.');
		}

		return this.instance.getOrDefault(key, defaultFn);
	}

	static async init(hooksPath?: string): Promise<void> {
		if (this.instance) {
			throw new Error('Hooks already initialized.');
		}

		const hooks = await this.loadHooks(hooksPath);

		this.instance = new Hooks(hooks);
	}

	static reset(): void {
		this.instance = undefined;
	}

	private static async loadHooks(hooksFile?: string): Promise<[string, HookFn][]> {
		const hooks: [string, HookFn][] = [];

		if (hooksFile) {
			const fileService = new FileService();
			const hooksObj = await fileService.loadFile<Record<string, HookFn>>(hooksFile);

			for (const [key, hook] of Object.entries(hooksObj)) {
				hooks.push([key, hook]);
			}
		}

		return hooks;
	}

	private readonly hooks: Map<string, HookFn>;

	private constructor(hooks: [string, HookFn][]) {
		this.hooks = new Map<string, HookFn>(hooks);
	}

	getOrDefault<T extends AnyFn>(key: string, defaultFn: T): T {
		const fn = this.hooks.get(key);

		if (fn) {
			return ((...args: unknown[]) => fn(defaultFn, ...args)) as T;
		}

		return defaultFn;
	}
}
