import { IEnum } from './parser/entities/enum.model';
import { IObject } from './parser/entities/object.model';
import { IPath } from './parser/entities/path.model';

export interface IDocument {
	enums: IEnum[];
	objects: IObject[];
	paths: IPath[];
}
