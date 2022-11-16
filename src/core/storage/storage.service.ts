export class Storage<T1, T2> {
	private readonly storage = new Map<T1, T2>();

	set(key: T1, value: T2): void {
		if (this.has(key)) {
			throw new Error('Key already set.');
		}

		this.storage.set(key, value);
	}

	get(key: T1): T2 {
		const value = this.storage.get(key);

		if (!value) {
			throw new Error('Key not found.');
		}

		return value;
	}

	has(key: T1): boolean {
		return this.storage.has(key);
	}

	delete(key: T1): void {
		this.storage.delete(key);
	}
}
