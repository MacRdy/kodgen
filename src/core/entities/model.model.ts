import { SchemaEntity } from './shared.model';

export class ArrayModelDef {
	constructor(readonly items: ModelDef) {}
}

export class PrimitiveModelDef {
	constructor(readonly type: string, readonly format?: string) {}
}

export class ObjectModelDef {
	get name(): string {
		return this._name;
	}

	private _name: string;

	get properties(): ReadonlyArray<ReferenceModel> {
		return this._properties;
	}

	private _properties: ReadonlyArray<ReferenceModel>;

	constructor(name: string, properties?: ReadonlyArray<ReferenceModel>) {
		this._name = name;
		this._properties = properties ?? [];
	}

	setName(name: string): void {
		this._name = name;
	}

	setProperties(properties: ReferenceModel[]): void {
		this._properties = properties;
	}
}

export class ReferenceModel {
	constructor(
		readonly name: string,
		readonly def: SchemaEntity,
		readonly required: boolean,
		readonly nullable: boolean,
	) {}

	clone(name?: string): ReferenceModel {
		return new ReferenceModel(name ?? this.name, this.def, this.required, this.nullable);
	}
}

export type ModelDef = ArrayModelDef | PrimitiveModelDef | ObjectModelDef;
