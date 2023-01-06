export class DataProvider {
	private static instance?: DataProvider;

	static get<T>(key: unknown): T {
		if (!this.instance) {
			this.instance = new DataProvider();
		}

		return this.instance.get(key);
	}

	static register<T>(key: unknown, data: T): void {
		if (!this.instance) {
			this.instance = new DataProvider();
		}

		this.instance.register(key, data);
	}

	private readonly registry = new Map<unknown, unknown>();

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	register<T>(key: unknown, data: T): void {
		this.registry.set(key, data);
	}

	get<T>(key: unknown): T {
		if (!this.registry.has(key)) {
			throw new Error('Unknown key');
		}

		return this.registry.get(key) as T;
	}
}
