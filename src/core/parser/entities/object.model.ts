import { AnyFormat, AnyType } from '../parser.model';

export class ObjectDef {
	constructor(readonly name: string, readonly properties: ObjectPropertyDef[]) {}
}

export class ObjectPropertyDef {
	constructor(
		readonly name: string,
		readonly type: AnyType,
		readonly format: AnyFormat,
		readonly required: boolean,
		readonly nullable: boolean,
		readonly isArray: boolean,
	) {}
}
