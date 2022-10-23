import { ArrayType, ObjectType, PrimitiveType, PrimitiveTypeFormat } from '../parser.model';

export class BaseModelDef {
	constructor(readonly name: string, readonly required: boolean, readonly nullable: boolean) {}
}

export class PrimitiveModelDef extends BaseModelDef {
	constructor(
		name: string,
		required: boolean,
		nullable: boolean,
		readonly type: PrimitiveType,
		readonly format?: PrimitiveTypeFormat,
	) {
		super(name, required, nullable);
	}
}

export class ObjectModelDef extends BaseModelDef {
	constructor(
		name: string,
		required: boolean,
		nullable: boolean,
		readonly type: ObjectType,
		readonly properties: ModelDef[],
	) {
		super(name, required, nullable);
	}
}

export class ArrayModelDef extends BaseModelDef {
	constructor(
		name: string,
		required: boolean,
		nullable: boolean,
		readonly type: ArrayType,
		readonly items: ModelDef,
	) {
		super(name, required, nullable);
	}
}

export type ModelDef = PrimitiveModelDef | ObjectModelDef | ArrayModelDef;
