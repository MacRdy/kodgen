import { Info } from './info.model';
import { Path } from './path.model';
import { Server } from './server.model';
import { Model } from './shared.model';
import { Tag } from './tag.model';

export interface IDocument {
	info: Info;
	models: Model[];
	paths: Path[];
	servers: Server[];
	tags: Tag[];
}
