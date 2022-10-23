export class ReferenceDef {
	private readonly id = Math.random().toString();

	get(): string {
		return `#${this.id}`;
	}
}
