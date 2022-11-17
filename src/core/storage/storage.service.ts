export class Storage<T1, T2> {
	private readonly storage = new Map<T1, T2>();

	set(key: T1, value: T2): void {
		if (this.storage.has(key)) {
			throw new Error('Key already set.');
		}

		this.storage.set(key, value);
	}

	get(key: T1): T2 | undefined {
		return this.storage.get(key);
	}

	delete(key: T1): void {
		this.storage.delete(key);
	}

	some(predicate: (item: T2) => boolean): boolean {
		return [...this.storage.values()].some(predicate);
	}
}
