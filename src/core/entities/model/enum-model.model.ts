import { NamedModel } from '../named.model';
import { Extensions, IntegerType, NumberType, StringType } from '../shared.model';

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
	constructor(
		readonly name: string,
		readonly value: T,
		details?: Partial<EnumEntryDetails>,
	) {
		super();

		this.deprecated = details?.deprecated ?? this.deprecated;
		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
	}
}

export type EnumType = IntegerType | NumberType | StringType;

export class EnumModelDetails extends NamedModel {
	deprecated: boolean;
	format?: string;
	description?: string;
	extensions: Extensions;

	constructor(name: string) {
		super(name, false);

		this.deprecated = false;
		this.extensions = {};
	}
}

export class EnumModel<T = unknown> extends EnumModelDetails {
	constructor(
		name: string,
		public type: EnumType,
		public entries: EnumEntry<T>[],
		details?: Partial<EnumModelDetails>,
	) {
		super(name);

		this.originalName = details?.originalName ?? this.originalName;
		this.deprecated = details?.deprecated ?? this.deprecated;
		this.format = details?.format;
		this.description = details?.description;
		this.origin = details?.origin;
		this.extensions = details?.extensions ?? this.extensions;
	}
}
