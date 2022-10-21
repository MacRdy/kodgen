import { PrimitiveType, PrimitiveTypeFormat } from '../parser.model';

export class ObjectDef {
	constructor(readonly name: string, readonly properties: ObjectProperty[]) {}
}

interface IBaseObjectProperty {
	readonly required: boolean;
	readonly nullable: boolean;
	readonly isArray: boolean;
}

export interface PrimitiveObjectProperty extends IBaseObjectProperty {
	readonly name: string;
	readonly type: PrimitiveType;
	readonly format?: PrimitiveTypeFormat;
}

export interface ComplexObjectProperty extends IBaseObjectProperty {
	readonly object: ObjectDef;
}

export type ObjectProperty = PrimitiveObjectProperty | ComplexObjectProperty;

export const isComplexObjectProperty = <T extends Partial<ComplexObjectProperty>>(
	obj: T,
): obj is T & ComplexObjectProperty => !!obj.object;
