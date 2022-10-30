import { ArrayType, ICanChangeName, ObjectType, PrimitiveType, SchemaEntity } from './shared.model';

export interface ICloneableModel {
	clone(name?: string): BaseModelDef;
}

export abstract class BaseModelDef implements ICloneableModel, ICanChangeName {
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

	clone(): BaseModelDef {
		throw new Error('Method not implemented.');
	}
}

export class PrimitiveModelDef extends BaseModelDef {
	constructor(
		name: string,
		readonly type: PrimitiveType,
		readonly format?: string,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);
	}

	override clone(name?: string): BaseModelDef {
		return new PrimitiveModelDef(
			name ?? this.name,
			this.type,
			this.format,
			this.required,
			this.nullable,
		);
	}
}

export class ObjectModelDef<T extends BaseModelDef = ModelDef> extends BaseModelDef {
	readonly type: ObjectType;

	get properties(): ReadonlyArray<T> {
		return this._properties;
	}

	private _properties: ReadonlyArray<T>;

	constructor(
		name: string,
		properties?: ReadonlyArray<T>,
		required?: boolean,
		nullable?: boolean,
	) {
		super(name, required, nullable);

		this._properties = properties ?? [];
		this.type = 'object';
	}

	setProperties(properties: T[]): void {
		this._properties = properties;
	}

	override clone(name?: string): BaseModelDef {
		return new ObjectModelDef(name ?? this.name, this.properties, this.required, this.nullable);
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

	override clone(name?: string): BaseModelDef {
		return new ArrayModelDef(name ?? this.name, this.itemsDef, this.required, this.nullable);
	}
}

export class ReferenceModelDef extends BaseModelDef {
	constructor(name: string, readonly def: SchemaEntity, required?: boolean, nullable?: boolean) {
		super(name, required, nullable);
	}

	override clone(name?: string): BaseModelDef {
		return new ReferenceModelDef(name ?? this.name, this.def, this.required, this.nullable);
	}
}

export type ModelDef =
	| BaseModelDef
	| PrimitiveModelDef
	| ObjectModelDef
	| ArrayModelDef
	| ReferenceModelDef;
