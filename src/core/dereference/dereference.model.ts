import { IJsonSchemaRef } from './json-ref/json-schema-ref.model';

export interface IDereferenceEntry {
	refObject: IJsonSchemaRef;
	keys: ReadonlyArray<string>;
}
