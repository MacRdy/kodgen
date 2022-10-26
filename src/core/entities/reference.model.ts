import cuid from 'cuid';

export interface IReferable {
	readonly ref: Reference;
}

export class Reference {
	private readonly id: string;

	constructor(id?: string) {
		this.id = id ? id : cuid();
	}

	get(): string {
		return this.id;
	}
}
