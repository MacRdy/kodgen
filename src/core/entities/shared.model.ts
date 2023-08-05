import { ArrayModel } from './model/array-model.model';
import { ConstantModel } from './model/constant-model.model';
import { EnumModel } from './model/enum-model.model';
import { ExtendedModel } from './model/extended-model.model';
import { NullModel } from './model/null-model.model';
import { ObjectModel } from './model/object-model.model';
import { SimpleModel } from './model/simple-model.model';
import { UnknownModel } from './model/unknown-model.model';

export type IntegerType = 'integer';
export type NumberType = 'number';
export type StringType = 'string';
export type BooleanType = 'boolean';
export type ArrayType = 'array';
export type ObjectType = 'object';

export const isReferenceModel = (model: Model): model is EnumModel | ObjectModel =>
	model instanceof EnumModel || model instanceof ObjectModel;

export interface IReferenceModel {
	name: string;
	originalName: boolean;
	origin?: string;
}

export type Model =
	| ArrayModel
	| SimpleModel
	| ObjectModel
	| ExtendedModel
	| UnknownModel
	| NullModel
	| EnumModel
	| ConstantModel;

export type Extensions = Record<string, unknown>;
