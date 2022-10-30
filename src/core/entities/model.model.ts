import { PrimitiveType, SchemaEntity } from './shared.model';

export interface ICloneableReference {
	clone(name?: string): Reference;
}

export class PrimitiveModelDef {
	constructor(readonly type: PrimitiveType, readonly format?: string) {}
}

export class ObjectModelDef<T extends Reference = Reference> {
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

export abstract class BaseReferenceModel implements ICloneableReference {
	constructor(readonly name: string) {}

	clone(): Reference {
		throw new Error('Method not implemented.');
	}
}

export class ArrayReferenceModel extends BaseReferenceModel {
	constructor(
		name: string,
		readonly itemsDef: SchemaEntity, // TODO reference zhe eshe? array-in-array
		readonly required: boolean,
		readonly nullable: boolean,
	) {
		super(name);
	}

	derefedence(): SchemaEntity {
		return this.itemsDef;
	}

	override clone(name?: string): Reference {
		return new ArrayReferenceModel(
			name ?? this.name,
			this.itemsDef,
			this.required,
			this.nullable,
		);
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

	derefedence(): SchemaEntity {
		return this.def;
	}

	override clone(name?: string): Reference {
		return new ReferenceModel(name ?? this.name, this.def, this.required, this.nullable);
	}
}

export type ModelDef = PrimitiveModelDef | ObjectModelDef;
export type Reference = ArrayReferenceModel | ReferenceModel;
