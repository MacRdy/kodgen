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
	if (previousPath) {
		const fileLoadService = new FileLoadService();

		const isLocalPath = fileLoadService.isSupported(path);
		const isLocalPreviousPath = fileLoadService.isSupported(previousPath);

		const resolveLocal = (current: string, previous: string): string => {
			const dir = pathLib.posix.dirname(previous);

			return pathLib.posix.join(dir, current);
		};

		if (!isLocalPreviousPath) {
			const previousUrl = new URL(previousPath);

			if (isLocalPath && path.startsWith('//')) {
				return `${previousUrl.protocol}${path}`;
			} else if (isLocalPath) {
				const newPath = resolveLocal(path, previousUrl.pathname);

				return `${previousUrl.origin}${newPath}`;
			}

			return path;
		}

		return resolveLocal(path, previousPath);
	}

	return path;
};
