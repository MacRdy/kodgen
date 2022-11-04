import pathLib from 'path';
import { IImportRegistryEntry } from './import-registry.model';

export class ImportRegistryService {
	private readonly registry = new Map<string, string>();

	createLink(key: string, path: string): void {
		this.registry.set(key, path);
	}

	getImportEntries(keys: string[], currentFilePath: string): IImportRegistryEntry[] {
		const imports = this.createImports(keys);

		const importEntries: IImportRegistryEntry[] = [];

		for (const [path, entities] of Object.entries(imports)) {
			if (path === currentFilePath) {
				continue;
			}

			const importPath = pathLib.posix.relative(pathLib.dirname(currentFilePath), path);

			const entry: IImportRegistryEntry = {
				keys: [...new Set(entities)],
				path: `${!importPath.startsWith('.') ? './' : ''}${importPath}`,
			};

			importEntries.push(entry);
		}

		return importEntries;
	}

	private createImports(keys: string[]): Record<string, string[]> {
		const imports: Record<string, string[]> = {};

		for (const d of keys) {
			const path = this.registry.get(d);

			if (!path) {
				throw new Error('Unknown dependency.');
			}

			if (imports[path]) {
				imports[path]?.push(d);
			} else {
				imports[path] = [d];
			}
		}

		return imports;
	}
}
