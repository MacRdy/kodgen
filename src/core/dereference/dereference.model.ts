import { JsonSchemaRef } from './json-schema-ref/json-schema-ref';

export interface IDereferenceEntry {
	ref: JsonSchemaRef;
	keys: ReadonlyArray<string>;
}

export const DEREFERENCE_RESOLVED_VALUE_KEY = Symbol();

export const getDereferenceResolvedValueOrDefault = <T>(obj: T): T =>
	(!!obj &&
		typeof obj === 'object' &&
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		((obj as any)[DEREFERENCE_RESOLVED_VALUE_KEY] as T)) ||
	obj;
