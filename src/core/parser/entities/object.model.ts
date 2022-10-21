import { AnyFormat, AnyType } from '../parser.model';

export interface IObject {
	name: string;
	properties: IObjectProperty[];
}

export interface IObjectProperty {
	name: string;
	type: AnyType;
	format: AnyFormat;
	required: boolean;
	nullable: boolean;
	isArray: boolean;
}
