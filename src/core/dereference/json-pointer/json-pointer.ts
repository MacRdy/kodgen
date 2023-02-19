export class JsonPointer {
	static readonly DELIMITER = '/';
	static readonly ROOT = `#`;

	private readonly location?: string;
	private readonly keys: string[];

	private readonly _isLocal: boolean;
	private readonly _isExternal: boolean;

	constructor(pointer: string) {
		if (!pointer) {
			throw new Error('Invalid JSON Pointer');
		}

		const [location, localPointer] = pointer.split(JsonPointer.ROOT);

		if (localPointer && !localPointer.startsWith(JsonPointer.DELIMITER)) {
			throw new Error('Invalid JSON Pointer');
		}

		this.location = location;

		this.keys =
			localPointer
				?.substring(1)
				.split(JsonPointer.DELIMITER)
				.map(decodeURIComponent)
				.map(x => x.replace(/~1/g, '/').replace(/~0/g, '~')) ?? [];

		this._isLocal = !location;
		this._isExternal = !!location;
	}

	isLocal(): boolean {
		return this._isLocal;
	}

	getLocals(): string[] {
		return this.keys;
	}

	isExternal(): boolean {
		return this._isExternal;
	}

	getLocation(): string | undefined {
		return this.location;
	}

	toString(): string {
		const objectPath = this.keys
			.map(x => x.replace(/~/g, '~0').replace(/\//g, '~1'))
			.map(encodeURIComponent)
			.join(JsonPointer.DELIMITER);

		const fullLocalPointer = objectPath
			? `${JsonPointer.ROOT}${JsonPointer.DELIMITER}${objectPath}`
			: '';

		const fullPointer = `${this.location ?? ''}${fullLocalPointer}`;

		return fullPointer || JsonPointer.ROOT;
	}
}
