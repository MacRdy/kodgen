import { IHasDescription } from '../description.model';
import { NamedModel } from '../named.model';
import { Extensions, Model } from '../shared.model';
import { Property } from './property.model';

export class ObjectModelDetails extends NamedModel implements IHasDescription {
	properties: Property[];
	additionalProperties?: Model;
	deprecated: boolean;
	description?: string;
	extensions: Extensions;

	constructor(name: string) {
		super(name, false);

		this.properties = [];
		this.deprecated = false;
		this.extensions = {};
	}
}

export class ObjectModel extends ObjectModelDetails {
	constructor(name: string, details?: Partial<ObjectModelDetails>) {
		super(name);

		this.originalName = details?.originalName ?? this.originalName;
		this.properties = details?.properties ?? this.properties;
		this.additionalProperties = details?.additionalProperties;
		this.deprecated = details?.deprecated ?? this.deprecated;
		this.description = details?.description;
		this.extensions = details?.extensions ?? this.extensions;
		this.origin = details?.origin;
	}
}
