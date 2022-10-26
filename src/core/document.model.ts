import { EnumDef } from './parser/entities/enum.model';
import { ModelDef } from './parser/entities/model.model';
import { PathDef } from './parser/entities/path.model';

export interface ICanChangeName {
	setName(name: string): void;
}

export type SchemaEntity = EnumDef | ModelDef;

export interface IDocument {
	enums: EnumDef[];
	models: ModelDef[];
	paths: PathDef[];
}

export declare interface Type<T> extends Function {
	new (...args: any[]): T;
}
