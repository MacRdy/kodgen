export interface IJsonSchemaRef {
	$ref: string;
}

export interface IJsonSchemaRefData {
	keys: string[];
	source?: string;
}

export const isJsonSchemaRef = (obj: unknown): obj is IJsonSchemaRef =>
	!!obj &&
	typeof obj === 'object' &&
	typeof (obj as IJsonSchemaRef).$ref === 'string' &&
	!!(obj as IJsonSchemaRef).$ref;
