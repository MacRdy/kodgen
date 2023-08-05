import { Extensions, IReferenceModel, Model } from '../shared.model';
import { Property } from './property.model';

export class ObjectModelDetails {
	properties: Property[];
	additionalProperties?: Model;
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

export class ObjectModel extends ObjectModelDetails implements IReferenceModel {
	constructor(
		public name: string,
		details?: Partial<ObjectModelDetails>,
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
