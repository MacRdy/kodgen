import { Extensions, IntegerType, IReferenceModel, NumberType, StringType } from '../shared.model';

export interface IEnumEntryDefDetails {
	deprecated?: boolean;
	description?: string;
	extensions?: Extensions;
}

export class EnumEntryDef<T = unknown> {
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor(readonly name: string, readonly value: T, details?: IEnumEntryDefDetails) {
		this.deprecated = details?.deprecated ?? false;
		this.description = details?.description;
		this.extensions = details?.extensions ?? {};
	}
}

export type EnumType = IntegerType | NumberType | StringType;

export interface IEnumDefDetails {
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
		details?: IEnumDefDetails,
	) {
		this.originalName = details?.originalName ?? false;
		this.deprecated = details?.deprecated ?? false;
		this.format = details?.format;
		this.description = details?.description;
		this.origin = details?.origin;
		this.extensions = details?.extensions ?? {};
	}
}
