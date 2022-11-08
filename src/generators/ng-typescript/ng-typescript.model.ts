import { PathMethod } from '@core/entities/schema-entities/path-def.model';
import { Extensions } from '@core/entities/shared.model';
import { Hooks } from '@core/hooks/hooks';
import { toCamelCase, toPascalCase } from '@core/utils';

export interface INgtsEnumEntry<T = unknown> {
	name: string;
	value: T;
}

export interface INgtsEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: INgtsEnumEntry[];
	extensions?: Extensions;
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

export interface INgtsPath {
	name: string;
	urlPattern: string;
	method: PathMethod;
	responseType: string;
	dependencies: string[];
	isMultipart: boolean;
	extensions?: Extensions;
	requestPathParameters?: INgtsModelProperty[];
	requestQueryParametersType?: string;
	requestQueryParametersMapping?: (readonly [string, string])[];
	requestBodyType?: string;
}

export const generateEntityName = (...parts: string[]): string => {
	const fn = Hooks.getOrDefault('generateEntityName', toPascalCase);

	return fn(...parts);
};

export const generatePropertyName = (...parts: string[]): string => {
	const fn = Hooks.getOrDefault('generatePropertyName', toCamelCase);

	return fn(...parts);
};

export const generateMethodName = (...parts: string[]): string => {
	const fn = Hooks.getOrDefault('generateMethodName', toCamelCase);

	return fn(...parts);
};
