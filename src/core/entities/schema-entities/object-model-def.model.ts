import { Extensions, IReferenceEntity, REGULAR_OBJECT_ORIGIN } from '../shared.model';
import { Property } from './property.model';

export class ObjectModelDef implements IReferenceEntity {
	private origin: string;
	private autoName: boolean;

	constructor(
		public name: string,
		public properties: readonly Property[] = [],
		readonly deprecated = false,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {
		this.origin = REGULAR_OBJECT_ORIGIN;
		this.autoName = false;
	}

	isAutoName(): boolean {
		return this.autoName;
	}

	setOrigin(origin: string, isAutoName: boolean): void {
		this.origin = origin;
		this.autoName = isAutoName;
	}

	getOrigin(): string {
		return this.origin;
	}
}
