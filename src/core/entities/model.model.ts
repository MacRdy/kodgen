import {
	ArrayType,
	ICanChangeName,
	ObjectType,
	PrimitiveType,
	PrimitiveTypeFormat,
	SchemaEntity,
} from './shared.model';

export class BaseModelDef implements ICanChangeName {
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

export class ObjectModelDef<T extends BaseModelDef = ModelDef> extends BaseModelDef {
	readonly type: ObjectType;

	constructor(
		name: string,
		readonly properties: ReadonlyArray<T>,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);

		this.type = 'object';
	}
}

export class ArrayModelDef extends BaseModelDef {
	readonly type: ArrayType;

	constructor(
		name: string,
		readonly itemsDef: SchemaEntity,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);

		this.type = 'array';
	}
}

export class ReferenceModelDef extends BaseModelDef {
	constructor(name: string, readonly def: SchemaEntity, required?: boolean, nullable?: boolean) {
		super(name, required, nullable);
	}
}

export type ModelDef =
	| BaseModelDef
	| PrimitiveModelDef
	| ObjectModelDef
	| ArrayModelDef
	| ReferenceModelDef;
