import { Extensions, IReferenceModel, ModelDef } from '../shared.model';
import { Property } from './property.model';

export class ObjectModelDefDetails {
	properties: Property[];
	additionalProperties?: ModelDef;
	deprecated: boolean;
	description?: string;
	extensions: Extensions;
	origin?: string;
	originalName: boolean;

	constructor() {
		this.properties = [];
		this.deprecated = false;
		this.extensions = {};
		this.originalName = false;
	}
}

export class ObjectModelDef extends ObjectModelDefDetails implements IReferenceModel {
	constructor(
		public name: string,
		details?: Partial<ObjectModelDefDetails>,
	) {
		super();

		this.originalName = details?.originalName ?? this.originalName;
		this.properties = details?.properties ?? this.properties;
		this.additionalProperties = details?.additionalProperties;
		this.deprecated = details?.deprecated ?? this.deprecated;
		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
		this.origin = details?.origin;
	}
}
