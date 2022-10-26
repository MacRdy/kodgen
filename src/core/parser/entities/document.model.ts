import { EnumDef } from './enum.model';
import { ModelDef } from './model.model';
import { PathDef } from './path.model';

export interface IDocument {
	enums: EnumDef[];
	models: ModelDef[];
	paths: PathDef[];
}
