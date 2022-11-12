import { EnumDef } from './schema-entities/enum-def.model';
import { ObjectModelDef } from './schema-entities/object-model-def.model';
import { PathDef } from './schema-entities/path-def.model';

export interface IDocument {
	enums: EnumDef[];
	models: ObjectModelDef[];
	paths: PathDef[];
}
