import { EnumDef } from './enum-def.model';
import { ObjectModelDef } from './model-def.model';
import { PathDef } from './path-def.model';

export interface IDocument {
	enums: EnumDef[];
	models: ObjectModelDef[];
	paths: PathDef[];
}
