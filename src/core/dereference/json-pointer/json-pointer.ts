export class JsonPointer {
	static readonly DELIMITER = '/';
	static readonly ROOT = `#`;

	private readonly source?: string;
	private readonly keys: string[];

	private readonly _isLocal: boolean;
	private readonly _isExternal: boolean;

	constructor(pointer: string) {
		if (!pointer) {
			throw new Error('Invalid JSON Pointer');
		}

		const [source, objectPath] = pointer.split(JsonPointer.ROOT);

		if (objectPath && !objectPath.startsWith(JsonPointer.DELIMITER)) {
			throw new Error('Invalid JSON Pointer');
		}

		this.source = source;

		this.keys =
			objectPath
				?.substring(1)
				.split(JsonPointer.DELIMITER)
				.map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'))
				.map(decodeURIComponent) ?? [];

		this._isLocal = !source;
		this._isExternal = !!source;
	}

	isLocal(): boolean {
		return this._isLocal;
	}

	isExternal(): boolean {
		return this._isExternal;
	}

	toString(): string {
		const objectPath = this.keys
			.map(x => x.replace(/~/g, '~0').replace(/\//g, '~1'))
			.map(encodeURIComponent)
			.join(JsonPointer.DELIMITER);

		const localPointer = objectPath
			? `${JsonPointer.ROOT}${JsonPointer.DELIMITER}${objectPath}`
			: '';

		const fullPointer = `${this.source ?? ''}${localPointer}`;

		return fullPointer || JsonPointer.ROOT;
	}
}
