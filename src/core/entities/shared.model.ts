import { ArrayModelDef } from './model/array-model-def.model';
import { ConstantModelDef } from './model/constant-model-def.model';
import { EnumModelDef } from './model/enum-model-def.model';
import { ExtendedModelDef } from './model/extended-model-def.model';
import { NullModelDef } from './model/null-model-def.model';
import { ObjectModelDef } from './model/object-model-def.model';
import { SimpleModelDef } from './model/simple-model-def.model';
import { UnknownModelDef } from './model/unknown-model-def.model';

export type IntegerType = 'integer';
export type NumberType = 'number';
export type StringType = 'string';
export type BooleanType = 'boolean';
export type ArrayType = 'array';
export type ObjectType = 'object';

export const isReferenceModel = (entity: ModelDef): entity is EnumModelDef | ObjectModelDef =>
	entity instanceof EnumModelDef || entity instanceof ObjectModelDef;

export interface IReferenceModel {
	name: string;
	originalName: boolean;
	origin?: string;
}

export type ModelDef =
	| ArrayModelDef
	| SimpleModelDef
	| ObjectModelDef
	| ExtendedModelDef
	| UnknownModelDef
	| NullModelDef
	| EnumModelDef
	| ConstantModelDef;

export type Extensions = Record<string, unknown>;
