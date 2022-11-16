import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { PathMethod } from '@core/entities/schema-entities/path-def.model';
import { Extensions, SchemaEntity } from '@core/entities/shared.model';
import { Hooks } from '@core/hooks/hooks';
import { toCamelCase, toPascalCase } from '@core/utils';

export interface ITsGeneratorConfig {
	enumDir: string;
	enumFileNameResolver: (name: string) => string;
	enumTemplate: string;

	modelDir: string;
	modelFileNameResolver: (name: string) => string;
	modelTemplate: string;

	pathDir: string;
	pathFileNameResolver: (name: string) => string;
	pathTemplate: string;
}

export interface ITsEnumEntry<T = unknown> {
	name: string;
	value: T;
}

export interface ITsEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: ITsEnumEntry[];
	deprecated: boolean;
	extensions?: Extensions;
	description?: string;
}

export interface ITsModelProperty {
	name: string;
	type: string;
	required: boolean;
	nullable: boolean;
	deprecated: boolean;
	dependencies: string[];
	description?: string;
	extensions: Extensions;
}

export interface ITsModel {
	name: string;
	properties: ITsModelProperty[];
	deprecated: boolean;
	description?: string;
}

export interface ITsPathRequestQueryParametersMapping {
	originalName: string;
	objectPath: string[];
}

export interface ITsPathRequestBody {
	typeName: string;
	multipart: boolean;
}

export interface ITsPathRequest {
	pathParametersType?: ITsModel;
	queryParametersType?: ITsModel;
	queryParametersMapping?: ITsPathRequestQueryParametersMapping[];
	bodyTypeName?: string;
	multipart?: boolean;
	dependencies: string[];
}

export interface ITsPathResponse {
	typeName: string;
	dependencies: string[];
	description?: string;
}

export interface ITsPath {
	name: string;
	urlPattern: string;
	method: PathMethod;
	request: ITsPathRequest;
	response: ITsPathResponse;
	deprecated: boolean;
	summaries?: string[];
	descriptions?: string[];
	extensions: Extensions;
}

export const isDependency = (entity: SchemaEntity): entity is EnumDef | ObjectModelDef =>
	entity instanceof EnumDef || entity instanceof ObjectModelDef;

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
