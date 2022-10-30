import { PrimitiveType, SchemaEntity } from './shared.model';

// export interface ICloneableModelDef {
// 	clone(name?: string): BaseModelDef;
// }

export class PrimitiveModelDef {
	constructor(readonly type: PrimitiveType, readonly format?: string) {}
}

export class ObjectModelDef<T extends BaseReferenceModel = BaseReferenceModel> {
	get name(): string {
		return this._name;
	}

	private _name: string;

	get properties(): ReadonlyArray<T> {
		return this._properties;
	}

	private _properties: ReadonlyArray<T>;

	constructor(name: string, properties?: ReadonlyArray<T>) {
		this._name = name;
		this._properties = properties ?? [];
	}

	setName(name: string): void {
		this._name = name;
	}

	setProperties(properties: T[]): void {
		this._properties = properties;
	}
}

export abstract class BaseReferenceModel {
	constructor(readonly name: string) {}
}

export class ArrayReferenceModel extends BaseReferenceModel {
	constructor(
		name: string,
		readonly itemsDef: SchemaEntity,
		readonly required: boolean,
		readonly nullable: boolean,
	) {
		super(name);
	}
}

export class ReferenceModel extends BaseReferenceModel {
	constructor(
		name: string,
		readonly def: SchemaEntity,
		readonly required: boolean,
		readonly nullable: boolean,
	) {
		super(name);
	}
}

export type ModelDef = PrimitiveModelDef | ObjectModelDef;
export type Reference = ArrayReferenceModel | ReferenceModel;
