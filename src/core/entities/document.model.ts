import { IEnum } from './enum.model';
import { IObject } from './object.model';
import { IPath } from './path.model';

export interface IDocument {
	enums: IEnum[];
	objects: IObject[];
	paths: IPath[];
}
