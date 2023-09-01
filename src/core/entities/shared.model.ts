import { IHasDescription } from './description.model';
import { ArrayModel, ArrayModelDetails } from './model/array-model.model';
import { ConstantModel } from './model/constant-model.model';
import { EnumEntryDetails, EnumModel, EnumModelDetails } from './model/enum-model.model';
import { ExtendedModel, ExtendedModelDetails } from './model/extended-model.model';
import { NullModel } from './model/null-model.model';
import { ObjectModel, ObjectModelDetails } from './model/object-model.model';
import { PropertyDetails } from './model/property.model';
import { SimpleModel, SimpleModelDetails } from './model/simple-model.model';
import { UnknownModel } from './model/unknown-model.model';
import { VoidModel } from './model/void-model.model';

export type IntegerType = 'integer';
export type NumberType = 'number';
export type StringType = 'string';
export type BooleanType = 'boolean';
export type ArrayType = 'array';
export type ObjectType = 'object';

export type Model =
	| ArrayModel
	| SimpleModel
	| ObjectModel
	| ExtendedModel
	| UnknownModel
	| NullModel
	| EnumModel
	| ConstantModel
	| VoidModel;

export type Extensions = Record<string, unknown>;

export const hasDescription = (model: Model): model is IHasDescription =>
	model instanceof ArrayModelDetails ||
	model instanceof EnumEntryDetails ||
	model instanceof EnumModelDetails ||
	model instanceof ExtendedModelDetails ||
	model instanceof ObjectModelDetails ||
	model instanceof PropertyDetails ||
	model instanceof SimpleModelDetails;
