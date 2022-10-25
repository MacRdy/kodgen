import cuid from 'cuid';

export interface IReferable {
	readonly ref: Reference;
}

export class Reference {
	private readonly id: string;

	constructor(id?: string, namespace?: string) {
		if (id && namespace) {
			this.id = `${id}@${namespace}`;
		} else if (id) {
			this.id = id;
		} else {
			this.id = cuid();
		}
	}

	get(): string {
		return this.id;
	}
}
