import * as pathLib from 'path';
import { FileLoadService } from '../load/file-load.service';
import { JsonSchemaRef } from './json-schema-ref/json-schema-ref';

export interface IDereferenceEntry {
	ref: JsonSchemaRef;
	keys: ReadonlyArray<string>;
}

export const DEREFERENCE_RESOLVED_VALUE = Symbol('DEREFERENCE_RESOLVED_VALUE');

export const getDereferenceResolvedValueOrDefault = <T>(obj: T): T =>
	(!!obj &&
		typeof obj === 'object' &&
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		((obj as any)[DEREFERENCE_RESOLVED_VALUE] as T)) ||
	obj;

export const normalizePath = (path: string, previousPath?: string): string => {
	const fileLoadService = new FileLoadService();

	const isLocalPath = fileLoadService.isSupported(path);
	const isLocalPreviousPath = !!previousPath && fileLoadService.isSupported(previousPath);

	// TODO check protocol for '//:example.com'
	// if (isLocal) {
	// } else {
	// }

	if (previousPath) {
		const folder = pathLib.posix.dirname(previousPath);

		return pathLib.posix.join(folder, path);
	}

	return path;
};
