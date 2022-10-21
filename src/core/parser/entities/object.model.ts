import { AnyFormat, AnyType } from '../parser.model';

export class ObjectDef {
	constructor(readonly name: string, readonly properties: ObjectPropertyDef[]) {}
}

export class ObjectPropertyDef {
	constructor(
		readonly name: string,
		readonly type: AnyType,
		readonly required: boolean,
		readonly nullable: boolean,
		readonly format?: AnyFormat,
	) {}
}
