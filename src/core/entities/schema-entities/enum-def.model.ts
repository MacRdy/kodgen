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

export interface IEnumDefAdditional {
	deprecated?: boolean;
	format?: string;
	description?: string;
	extensions?: Extensions;
	origin?: string;
	isAutoName?: boolean;
}

export class EnumDef<T = unknown> implements IReferenceEntity {
	isAutoName: boolean;
	deprecated: boolean;
	format?: string;
	description?: string;
	origin: string;
	extensions: Extensions;

	constructor(
		public name: string,
		public type: EnumType,
		public entries: EnumEntryDef<T>[],
		additional?: IEnumDefAdditional,
	) {
		this.isAutoName = additional?.isAutoName ?? false;
		this.deprecated = additional?.deprecated ?? false;
		this.format = additional?.format;
		this.description = additional?.description;
		this.origin = additional?.origin ?? REGULAR_OBJECT_ORIGIN;
		this.extensions = additional?.extensions ?? {};
	}
}
