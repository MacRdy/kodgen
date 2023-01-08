import { EnumModelDef } from './schema-entities/enum-def.model';
import { ObjectModelDef } from './schema-entities/object-model-def.model';
import { PathDef } from './schema-entities/path-def.model';
import { Server } from './schema-entities/server.model';
import { Tag } from './schema-entities/tag.model';

export interface IDocument {
	enums: EnumModelDef[];
	models: ObjectModelDef[];
	paths: PathDef[];
	servers: Server[];
	tags: Tag[];
}
