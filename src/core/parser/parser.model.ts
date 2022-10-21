import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import { IDocument } from '../document.model';

export interface IParserService<T = unknown> {
	isSupported(doc: OpenAPI.Document): boolean;
	parse(doc: T, refs: SwaggerParser.$Refs): IDocument;
}

export type IntegerType = 'integer';
export type NumberType = 'number';
export type StringType = 'string';

export type AnyType = IntegerType | NumberType | StringType;

export type IntegerTypeFormat = 'int32' | 'int64';
export type NumberTypeFormat = 'float' | 'double';
export type StringTypeFormat = 'byte' | 'binary' | 'date' | 'date-time' | 'password' | undefined;

export type AnyFormat = IntegerTypeFormat | NumberTypeFormat | StringTypeFormat;

export type TypeFormat = IntegerTypeFormat | NumberTypeFormat | StringTypeFormat;

export const isIntegerType = (type?: string): type is IntegerType => type === 'integer';
export const isNumberType = (type?: string): type is NumberType => type === 'number';
export const isStringType = (type?: string): type is StringType => type === 'string';

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
	type: IntegerType;
	format: IntegerTypeFormat;
}

export interface INumberTypedFormat {
	type: NumberType;
	format: NumberTypeFormat;
}

export interface IStringTypedFormat {
	type: StringType;
	format: StringTypeFormat;
}

export type TypedFormat = IIntegerTypedFormat | INumberTypedFormat | IStringTypedFormat;
