import { EnumDef } from './parser/entities/enum.model';
import { ObjectDef } from './parser/entities/object.model';
import { PathDef } from './parser/entities/path.model';

export interface IDocument {
	enums: EnumDef[];
	objects: ObjectDef[];
	paths: PathDef[];
}
