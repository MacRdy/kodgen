import { EnumDef } from './enum.model';
import { ModelDef } from './model.model';

export interface ICanChangeName {
	setName(name: string): void;
}

export type SchemaEntity = EnumDef | ModelDef;
