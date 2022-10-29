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

export type NgtsPathMethod = 'get' | 'post' | 'put' | 'delete';

export interface INgtsPath {
	name: string;
	urlPattern: string;
	method: NgtsPathMethod;
	responseModelName: string;
	requestPathParameters?: INgtsModelProperty[];
	requestQueryParametersModelName?: string;
	requestQueryParametersMapping?: (readonly [string, string])[];
	requestBodyModelName?: string;
}
