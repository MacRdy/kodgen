import { PathDef } from './schema-entities/path-def.model';
import { Server } from './schema-entities/server.model';
import { Tag } from './schema-entities/tag.model';
import { ModelDef } from './shared.model';

export interface IDocument {
	models: ModelDef[];
	paths: PathDef[];
	servers: Server[];
	tags: Tag[];
}
