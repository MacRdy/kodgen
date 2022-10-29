import pathLib from 'path';
import { toCamelCase, toPascalCase } from '../../core/utils';

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
	dependencies: string[];
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
	dependencies: string[];
}

export interface INgtsImportEntry {
	entities: string[];
	path: string;
}

export const generateEntityName = (...parts: string[]): string => toPascalCase(...parts);
export const generatePropertyName = (...parts: string[]): string => toCamelCase(...parts);

export const generateImportEntries = (
	dependencies: string[],
	currentFilePath: string,
	registry: Map<string, string>,
): INgtsImportEntry[] => {
	const imports: Record<string, string[]> = {};

	for (const d of dependencies) {
		const path = registry.get(d);

		if (!path) {
			throw new Error('Unknown dependency.');
		}

		if (imports[path]) {
			imports[path]?.push(d);
		} else {
			imports[path] = [d];
		}
	}

	const importEntries: INgtsImportEntry[] = [];

	for (const [path, entities] of Object.entries(imports)) {
		if (path === currentFilePath) {
			continue;
		}

		const currentDir = pathLib.posix.join(...currentFilePath.split('/').slice(0, -1));
		const importPath = pathLib.posix.relative(currentDir, path);
		const jsImportPath = importPath.substring(0, importPath.length - 3);

		const entry: INgtsImportEntry = {
			entities: [...new Set(entities)],
			path: `${!jsImportPath.startsWith('.') ? './' : ''}${jsImportPath}`,
		};

		importEntries.push(entry);
	}

	return importEntries;
};
