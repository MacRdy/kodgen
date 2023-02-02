import { Extensions, IntegerType, IReferenceModel, NumberType, StringType } from '../shared.model';

export interface IEnumEntryDefAdditional {
	deprecated?: boolean;
	description?: string;
	extensions?: Extensions;
}

export class EnumEntryDef<T = unknown> {
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor(readonly name: string, readonly value: T, additional?: IEnumEntryDefAdditional) {
		this.deprecated = additional?.deprecated ?? false;
		this.description = additional?.description;
		this.extensions = additional?.extensions ?? {};
	}
}

export type EnumType = IntegerType | NumberType | StringType;

export interface IEnumDefAdditional {
	deprecated?: boolean;
	format?: string;
	description?: string;
	extensions?: Extensions;
	origin?: string;
	originalName?: boolean;
}

export class EnumModelDef<T = unknown> implements IReferenceModel {
	originalName: boolean;
	deprecated: boolean;
	format?: string;
	description?: string;
	origin?: string;
	extensions: Extensions;

	constructor(
		public name: string,
		public type: EnumType,
		public entries: EnumEntryDef<T>[],
		additional?: IEnumDefAdditional,
	) {
		this.originalName = additional?.originalName ?? false;
		this.deprecated = additional?.deprecated ?? false;
		this.format = additional?.format;
		this.description = additional?.description;
		this.origin = additional?.origin;
		this.extensions = additional?.extensions ?? {};
	}
}
