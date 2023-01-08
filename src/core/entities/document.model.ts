import { EnumDef } from './schema-entities/enum-def.model';
import { ObjectModelDef } from './schema-entities/object-model-def.model';
import { PathDef } from './schema-entities/path-def.model';
import { IServer } from './schema-entities/server.model';
import { Tag } from './schema-entities/tag.model';

export interface IDocument {
	enums: EnumDef[];
	models: ObjectModelDef[];
	paths: PathDef[];
	servers: IServer[];
	tags: Tag[];
}
