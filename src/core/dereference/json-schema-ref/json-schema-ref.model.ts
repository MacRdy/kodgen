export interface IJsonSchemaRef {
	$ref: string;
}

export interface IJsonSchemaRefData {
	keys: string[];
	source?: string;
}
