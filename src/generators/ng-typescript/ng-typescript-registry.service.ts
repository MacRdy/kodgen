import pathLib from 'path';
import { INgtsImportEntry } from './ng-typescript.model';

export class NgTypescriptRegistryService {
	private readonly registry = new Map<string, string>();

	createLink(name: string, path: string): void {
		this.registry.set(name, path);
	}

	resolveImportEntries(dependencies: string[], currentFilePath: string): INgtsImportEntry[] {
		const imports: Record<string, string[]> = {};

		for (const d of dependencies) {
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

		const importEntries: INgtsImportEntry[] = [];

		for (const [path, entities] of Object.entries(imports)) {
			if (path === currentFilePath) {
				continue;
			}

			const importPath = pathLib.posix.relative(pathLib.dirname(currentFilePath), path);
			const jsImportPath = importPath.substring(0, importPath.length - 3);

			const entry: INgtsImportEntry = {
				entities: [...new Set(entities)],
				path: `${!jsImportPath.startsWith('.') ? './' : ''}${jsImportPath}`,
			};

			importEntries.push(entry);
		}

		return importEntries;
	}
}
