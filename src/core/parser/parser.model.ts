import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { IDocument } from '../document.model';

export interface IParserProviderService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	create(doc: T, refs: SwaggerParser.$Refs): IParserService;
}

export interface IParserService {
	parse(): IDocument;
}

export type IntegerType = 'integer';
export type NumberType = 'number';
export type StringType = 'string';
export type BooleanType = 'boolean';
export type ArrayType = 'array';
export type ObjectType = 'object';

export type IntegerTypeFormat = 'int32' | 'int64';
export type NumberTypeFormat = 'float' | 'double';
export type StringTypeFormat = 'byte' | 'binary' | 'date' | 'date-time' | 'password' | undefined;

export type PrimitiveType = IntegerType | NumberType | StringType | BooleanType;
export type PrimitiveTypeFormat = IntegerTypeFormat | NumberTypeFormat | StringTypeFormat;

export const isIntegerType = (type?: string): type is IntegerType => type === 'integer';
export const isNumberType = (type?: string): type is NumberType => type === 'number';
export const isStringType = (type?: string): type is StringType => type === 'string';
export const isBooleanType = (type?: string): type is BooleanType => type === 'boolean';
export const isArrayType = (type?: string): type is ArrayType => type === 'array';
export const isObjectType = (type?: string): type is ObjectType => type === 'object';

export const isIntegerTypeFormat = (format?: string): format is IntegerTypeFormat =>
	format === 'int32' || format === 'int64';

export const isNumberTypeFormat = (format?: string): format is NumberTypeFormat =>
	format === 'float' || format === 'double';

export const isStringTypeFormat = (format?: string): format is StringTypeFormat =>
	typeof format === 'undefined' ||
	format === 'byte' ||
	format === 'binary' ||
	format === 'date' ||
	format === 'date-time' ||
	format === 'password';

export interface IIntegerTypedFormat {
	readonly type: IntegerType;
	readonly format: IntegerTypeFormat;
}

export interface INumberTypedFormat {
	readonly type: NumberType;
	readonly format: NumberTypeFormat;
}

export interface IStringTypedFormat {
	readonly type: StringType;
	readonly format?: StringTypeFormat;
}

export interface IBooleanTypedFormat {
	readonly type: BooleanType;
	readonly format?: undefined;
}

export type TypedFormat =
	| IIntegerTypedFormat
	| INumberTypedFormat
	| IStringTypedFormat
	| IBooleanTypedFormat;

export const isValidPrimitiveType = <
	T extends {
		type?: string;
		format?: string;
	},
>(
	obj: T,
): obj is T & TypedFormat =>
	(isIntegerType(obj.type) && isIntegerTypeFormat(obj.format)) ||
	(isNumberType(obj.type) && isNumberTypeFormat(obj.format)) ||
	(isStringType(obj.type) && isStringTypeFormat(obj.format)) ||
	(isBooleanType(obj.type) && typeof obj.format === 'undefined');

export const generateName = (parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });
