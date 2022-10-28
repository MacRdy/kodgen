export interface INgtsEnumEntry<T = unknown> {
	name: string;
	value: T;
}

export interface INgtsEnum {
	name: string;
	isStringlyTyped: boolean;
	entries: INgtsEnumEntry[];
}

export interface INgtsModelProperty {
	name: string;
	type: string;
	required: boolean;
	nullable: boolean;
}

export interface INgtsModel {
	name: string;
	properties: INgtsModelProperty[];
}

export interface INgtsPath {
	urlPattern: string;
	method: 'get' | 'post' | 'put' | 'delete';
	parameters?: INgtsModel[];
	body?: INgtsModel;
	responseTypeName?: string;
}
