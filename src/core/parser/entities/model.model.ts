import { ArrayType, ObjectType, PrimitiveType, PrimitiveTypeFormat } from '../parser.model';
import { IReferable, Reference } from './reference.model';

export class BaseModelDef implements IReferable {
	readonly ref = new Reference();

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
		readonly properties: ReadonlyArray<ModelDef>,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);

		this.object = 'object';
	}
}

export class ArrayModelDef extends BaseModelDef {
	readonly type: ArrayType;

	constructor(name: string, readonly items: Reference, required?: boolean, nullable?: boolean) {
		super(name, required, nullable);

		this.type = 'array';
	}
}

export class ReferenceModelDef implements IReferable {
	constructor(readonly name: string, readonly ref: Reference) {}
}

export type ModelDef = PrimitiveModelDef | ObjectModelDef | ArrayModelDef | ReferenceModelDef;
