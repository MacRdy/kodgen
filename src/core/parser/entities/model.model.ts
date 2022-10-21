import { PrimitiveType, PrimitiveTypeFormat } from '../parser.model';

export class ModelDef {
	constructor(readonly name: string, readonly properties: ModelProperty[]) {}
}

interface IBaseModelProperty {
	readonly required: boolean;
	readonly nullable: boolean;
	readonly isArray: boolean;
}

export interface PrimitiveModelProperty extends IBaseModelProperty {
	readonly name: string;
	readonly type: PrimitiveType;
	readonly format?: PrimitiveTypeFormat;
}

export interface ComplexModelProperty extends IBaseModelProperty {
	readonly model: ModelDef;
}

export type ModelProperty = PrimitiveModelProperty | ComplexModelProperty;

export const isComplexModelProperty = <T extends Partial<ComplexModelProperty>>(
	obj: T,
): obj is T & ComplexModelProperty => !!obj.model;
