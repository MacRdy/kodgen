import { toCamelCase, toPascalCase } from '../../core/utils';

export interface INgtsEnumEntry<T = unknown> {
	name: string;
	value: T;
}

export interface INgtsEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: INgtsEnumEntry[];
}

export interface INgtsModelProperty {
	name: string;
	type: string;
	required: boolean;
	nullable: boolean;
	dependencies: string[];
}

export interface INgtsModel {
	name: string;
	properties: INgtsModelProperty[];
}

export type NgtsPathMethod = 'get' | 'post' | 'put' | 'delete';

export interface INgtsPath {
	name: string;
	urlPattern: string;
	method: NgtsPathMethod;
	responseModelName: string;
	requestPathParameters?: INgtsModelProperty[];
	requestQueryParametersModelName?: string;
	requestQueryParametersMapping?: (readonly [string, string])[];
	requestBodyModelName?: string;
	dependencies: string[];
}

export interface INgtsImportEntry {
	entities: string[];
	path: string;
}

export const generateEntityName = (...parts: string[]): string => toPascalCase(...parts);
export const generatePropertyName = (...parts: string[]): string => toCamelCase(...parts);
