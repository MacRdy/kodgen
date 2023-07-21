import { Path } from './path.model';
import { Server } from './server.model';
import { ModelDef } from './shared.model';
import { Tag } from './tag.model';

export interface IDocument {
	models: ModelDef[];
	paths: Path[];
	servers: Server[];
	tags: Tag[];
}
