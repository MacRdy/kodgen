import { ArrayModelDef } from './schema-entities/array-model-def.model';
import { EnumModelDef } from './schema-entities/enum-def.model';
import { ExtendedModelDef } from './schema-entities/extended-model-def.model';
import { NullModelDef } from './schema-entities/null-model-def.model';
import { ObjectModelDef } from './schema-entities/object-model-def.model';
import { SimpleModelDef } from './schema-entities/simple-model-def.model';
import { UnknownModelDef } from './schema-entities/unknown-model-def.model';

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
	origin: string;
}

export type ModelDef =
	| ArrayModelDef
	| SimpleModelDef
	| ObjectModelDef
	| ExtendedModelDef
	| UnknownModelDef
	| NullModelDef
	| EnumModelDef;

export type Extensions = Record<string, unknown>;
