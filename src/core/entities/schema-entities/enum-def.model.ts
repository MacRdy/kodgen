import {
	Extensions,
	IntegerType,
	IReferenceEntity,
	NumberType,
	REGULAR_OBJECT_ORIGIN,
	StringType,
} from '../shared.model';

export class EnumEntryDef<T = unknown> {
	constructor(readonly name: string, readonly value: T) {}
}

export type EnumType = IntegerType | NumberType | StringType;

export class EnumDef<T = unknown> implements IReferenceEntity {
	private origin: string;
	private autoName: boolean;

	constructor(
		public name: string,
		readonly type: EnumType,
		readonly entries: EnumEntryDef<T>[],
		readonly deprecated: boolean = false,
		readonly format?: string,
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
