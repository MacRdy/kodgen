import cuid from 'cuid';

export interface IReferable {
	readonly ref: Reference;
}

export class Reference {
	private readonly id: string;

	constructor(id?: string, private readonly namespace?: string) {
		this.id = id ?? cuid();
	}

	get(): string {
		return this.namespace ? `#${this.id}@${this.namespace}` : `#${this.id}`;
	}
}
