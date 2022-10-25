import { EnumDef } from './parser/entities/enum.model';
import { ModelDef } from './parser/entities/model.model';
import { PathDef } from './parser/entities/path.model';

export type SchemaEntity = EnumDef | ModelDef;

export interface IDocument {
	enums: EnumDef[];
	models: ModelDef[];
	paths: PathDef[];
}
