export class ReferenceDef {
	private readonly id: string;

	constructor(id?: string, private readonly namespace?: string) {
		this.id = id ?? Math.random().toString();
	}

	get(): string {
		return this.namespace ? `#${this.id}@${this.namespace}` : `#${this.id}`;
	}
}
