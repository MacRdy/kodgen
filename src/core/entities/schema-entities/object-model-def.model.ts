import { Extensions, IReferenceEntity, REGULAR_OBJECT_ORIGIN } from '../shared.model';
import { Property } from './property.model';

export interface IObjectModelDefAdditional {
	properties?: Property[];
	deprecated?: boolean;
	description?: string;
	extensions?: Extensions;
	origin?: string;
	isAutoName?: boolean;
}

export class ObjectModelDef implements IReferenceEntity {
	isAutoName: boolean;
	properties: Property[];
	deprecated: boolean;
	description?: string;
	extensions: Extensions;
	origin: string;

	constructor(public name: string, additional?: IObjectModelDefAdditional) {
		this.isAutoName = additional?.isAutoName ?? false;
		this.properties = additional?.properties ?? [];
		this.deprecated = additional?.deprecated ?? false;
		this.description = additional?.description;
		this.extensions = additional?.extensions ?? {};
		this.origin = additional?.origin ?? REGULAR_OBJECT_ORIGIN;
	}
}
