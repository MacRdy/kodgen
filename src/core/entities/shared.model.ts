import { ArrayModelDef } from './schema-entities/array-model-def.model';
import { EnumDef } from './schema-entities/enum-def.model';
import { ObjectModelDef } from './schema-entities/model-def.model';
import { SimpleModelDef } from './schema-entities/simple-model-def.model';

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

export const isPrimitiveType = (type: string): type is PrimitiveType =>
	isIntegerType(type) || isNumberType(type) || isStringType(type) || isBooleanType(type);

export interface ICanChangeName {
	setName(name: string): void;
}

export type SchemaEntity = EnumDef | ModelDef;

export type ModelDef = ArrayModelDef | SimpleModelDef | ObjectModelDef;
