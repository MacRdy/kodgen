import { Extensions, IReferenceModel, ModelDef } from '../shared.model';
import { Property } from './property.model';

export const REGULAR_OBJECT_ORIGIN = 'REGULAR_OBJECT_ORIGIN';

export interface IObjectModelDefAdditional {
	properties?: Property[];
	additionalProperties?: ModelDef;
	deprecated?: boolean;
	description?: string;
	extensions?: Extensions;
	origin?: string;
	originalName?: boolean;
}

export class ObjectModelDef implements IReferenceModel {
	originalName: boolean;
	properties: Property[];
	additionalProperties?: ModelDef;
	deprecated: boolean;
	description?: string;
	extensions: Extensions;
	origin: string;

	constructor(public name: string, additional?: IObjectModelDefAdditional) {
		this.originalName = additional?.originalName ?? false;
		this.properties = additional?.properties ?? [];
		this.additionalProperties = additional?.additionalProperties;
		this.deprecated = additional?.deprecated ?? false;
		this.description = additional?.description;
		this.extensions = additional?.extensions ?? {};
		this.origin = additional?.origin ?? REGULAR_OBJECT_ORIGIN;
	}
}
