import { IJsonSchemaRef } from './json-ref/json-schema-ref.model';

export interface IDereferenceEntry {
	refObject: IJsonSchemaRef;
	keys: ReadonlyArray<string>;
}

export const DEREFERENCE_RESOLVED_ENTITY = '__KODGEN_DEREFERENCE_RESOLVED_ENTITY';

export const getDereferenceResolvedEntityOrDefault = <T>(obj: T): T =>
	(obj &&
		typeof obj === 'object' &&
		((obj as Record<string, unknown>)[DEREFERENCE_RESOLVED_ENTITY] as T)) ||
	obj;
