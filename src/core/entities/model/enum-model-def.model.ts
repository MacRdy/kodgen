import { Extensions, IntegerType, IReferenceModel, NumberType, StringType } from '../shared.model';

export class EnumEntryDetails {
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor() {
		this.deprecated = false;
		this.extensions = {};
	}
}

export class EnumEntry<T = unknown> extends EnumEntryDetails {
	constructor(readonly name: string, readonly value: T, details?: Partial<EnumEntryDetails>) {
		super();

		this.deprecated = details?.deprecated ?? this.deprecated;
		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
	}
}

export type EnumType = IntegerType | NumberType | StringType;

export class EnumModelDefDetails {
	deprecated: boolean;
	format?: string;
	description?: string;
	extensions: Extensions;
	origin?: string;
	originalName: boolean;

	constructor() {
		this.deprecated = false;
		this.extensions = {};
		this.originalName = false;
	}
}

export class EnumModelDef<T = unknown> extends EnumModelDefDetails implements IReferenceModel {
	constructor(
		public name: string,
		public type: EnumType,
		public entries: EnumEntry<T>[],
		details?: Partial<EnumModelDefDetails>,
	) {
		super();

		this.originalName = details?.originalName ?? this.originalName;
		this.deprecated = details?.deprecated ?? this.deprecated;
		this.format = details?.format;
		this.description = details?.description;
		this.origin = details?.origin;
		this.extensions = details?.extensions ?? this.extensions;
	}
}
