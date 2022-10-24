import { ArrayType, ObjectType, PrimitiveType, PrimitiveTypeFormat } from '../parser.model';
import { ReferenceDef } from './reference.model';

export class BaseModelDef {
	readonly ref = new ReferenceDef();

	constructor(readonly name: string, readonly required?: boolean, readonly nullable?: boolean) {}
}

export class PrimitiveModelDef extends BaseModelDef {
	constructor(
		name: string,
		readonly type: PrimitiveType,
		readonly format?: PrimitiveTypeFormat,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);
	}
}

export class ObjectModelDef extends BaseModelDef {
	readonly object: ObjectType;

	constructor(
		name: string,
		readonly properties: ModelDef[],
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);

		this.object = 'object';
	}
}

export class ArrayModelDef extends BaseModelDef {
	readonly type: ArrayType;

	constructor(name: string, readonly items: ModelDef, required?: boolean, nullable?: boolean) {
		super(name, required, nullable);

		this.type = 'array';
	}
}

export type ModelDef = PrimitiveModelDef | ObjectModelDef | ArrayModelDef | ReferenceDef;
