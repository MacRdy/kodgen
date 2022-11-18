import { ArrayModelDef } from './schema-entities/array-model-def.model';
import { EnumDef } from './schema-entities/enum-def.model';
import { ObjectModelDef } from './schema-entities/object-model-def.model';
import { SimpleModelDef } from './schema-entities/simple-model-def.model';

export type IntegerType = 'integer';
export type NumberType = 'number';
export type StringType = 'string';
export type BooleanType = 'boolean';
export type ArrayType = 'array';
export type ObjectType = 'object';

export type PrimitiveType = IntegerType | NumberType | StringType | BooleanType;

export const isIntegerType = (type?: string): type is IntegerType => type === 'integer';
export const isNumberType = (type?: string): type is NumberType => type === 'number';
export const isStringType = (type?: string): type is StringType => type === 'string';
export const isBooleanType = (type?: string): type is BooleanType => type === 'boolean';
export const isArrayType = (type?: string): type is ArrayType => type === 'array';
export const isObjectType = (type?: string): type is ObjectType => type === 'object';

export const isPrimitiveType = (type: string): type is PrimitiveType =>
	isIntegerType(type) || isNumberType(type) || isStringType(type) || isBooleanType(type);

export const isReferenceEntity = (entity: SchemaEntity): entity is EnumDef | ObjectModelDef =>
	entity instanceof EnumDef || entity instanceof ObjectModelDef;

export interface IReferenceEntity {
	setName(name: string): void;
	isAutoName(): boolean;
	setOrigin(origin: string, isAutoName: boolean): void;
	getOrigin(): string;
}

export const REGULAR_OBJECT_ORIGIN = 'REGULAR_OBJECT_ORIGIN';

export type ModelDef = ArrayModelDef | SimpleModelDef | ObjectModelDef;

export type SchemaEntity = EnumDef | ModelDef;

export type Extensions = Record<string, unknown>;
