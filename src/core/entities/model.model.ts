import { IReferable, Reference } from './reference.model';
import {
	ArrayType,
	ICanChangeName,
	ObjectType,
	PrimitiveType,
	PrimitiveTypeFormat,
} from './shared.model';

export class BaseModelDef implements IReferable, ICanChangeName {
	readonly ref = new Reference();

	get name(): string {
		return this._name;
	}

	private _name: string;

	constructor(name: string, readonly required?: boolean, readonly nullable?: boolean) {
		this._name = name;
	}

	setName(name: string): void {
		this._name = name;
	}
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

export class ReferenceModelDef extends BaseModelDef {
	constructor(
		name: string,
		readonly definitionRef: Reference,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);
	}
}

export type ModelDef =
	| BaseModelDef
	| PrimitiveModelDef
	| ObjectModelDef
	| ArrayModelDef
	| ReferenceModelDef;
