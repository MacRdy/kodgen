import { EnumDef } from './enum.model';
import { ModelDef } from './model.model';
import { PathDef } from './path.model';

export interface ICanChangeName {
	setName(name: string): void;
}

export type SchemaEntity = EnumDef | ModelDef;

export interface IDocument {
	enums: EnumDef[];
	models: ModelDef[];
	paths: PathDef[];
}
