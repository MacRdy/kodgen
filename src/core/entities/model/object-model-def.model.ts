import { Extensions, IReferenceModel, ModelDef } from '../shared.model';
import { Property } from './property.model';

export interface IObjectModelDefDetails {
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
	origin?: string;

	constructor(public name: string, details?: IObjectModelDefDetails) {
		this.originalName = details?.originalName ?? false;
		this.properties = details?.properties ?? [];
		this.additionalProperties = details?.additionalProperties;
		this.deprecated = details?.deprecated ?? false;
		this.description = details?.description;
		this.extensions = details?.extensions ?? {};
		this.origin = details?.origin;
	}
}
