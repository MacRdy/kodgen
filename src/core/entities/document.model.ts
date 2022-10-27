import { EnumDef } from './enum.model';
import { ObjectModelDef } from './model.model';
import { PathDef } from './path.model';

export interface IDocument {
	enums: EnumDef[];
	models: ObjectModelDef[];
	paths: PathDef[];
}
