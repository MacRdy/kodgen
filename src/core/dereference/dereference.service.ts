import { LoadService } from '../load/load.service';
import { DEREFERENCE_RESOLVED_VALUE, IDereferenceEntry } from './dereference.model';
import { JsonSchemaRef } from './json-schema-ref/json-schema-ref';
import { isJsonSchemaRef } from './json-schema-ref/json-schema-ref.model';

export class DereferenceService {
	constructor(private readonly loadService: LoadService) {}

	async dereference(obj: unknown, path: string): Promise<void> {
		await this.resolve(path, obj);
	}

	private async resolve(
		path: string,
		obj?: unknown,
		resolvedExternals = new Map<string, unknown>(),
		previousPath?: string,
	): Promise<unknown> {
		const normalizedPath = this.loadService.normalizePath(path, previousPath);

		if (resolvedExternals.has(normalizedPath)) {
			return resolvedExternals.get(normalizedPath);
		}

		if (!obj) {
			if (resolvedExternals.has(normalizedPath)) {
				obj = resolvedExternals.get(normalizedPath);
			} else {
				obj = await this.loadService.load(normalizedPath);

				resolvedExternals.set(normalizedPath, obj);
			}
		} else {
			resolvedExternals.set(normalizedPath, obj);
		}

		const allRefEntries = this.getAllReferences(obj).sort((a, b) => {
			if (
				(a.ref.pointer.isExternal() && b.ref.pointer.isExternal()) ||
				(a.ref.pointer.isLocal() && b.ref.pointer.isLocal())
			) {
				return 0;
			}

			return a.ref.pointer.isExternal() ? -1 : 1;
		});

		const resolvedEntries = new Set<IDereferenceEntry>();

		for (const entry of allRefEntries) {
			if (resolvedEntries.has(entry)) {
				continue;
			}

			if (entry.ref.pointer.isExternal()) {
				const externalPath = entry.ref.pointer.getLocation();

				if (!externalPath) {
					return;
				}

				const resolved = await this.resolve(
					externalPath,
					undefined,
					resolvedExternals,
					normalizedPath,
				);

				resolvedExternals.set(normalizedPath, resolved);

				const value = this.getValueByKeys(resolved, entry.ref.pointer.getLocals());

				if (!entry.keys.length) {
					obj = value;
				} else {
					this.setKey(obj, entry, value);
				}
			} else {
				this.resolveLocalReference(obj, entry, allRefEntries, resolvedEntries);
			}
		}

		return obj;
	}

	private resolveLocalReference(
		obj: unknown,
		entry: IDereferenceEntry,
		allEntries: IDereferenceEntry[],
		resolvedEntries: Set<IDereferenceEntry>,
	): void {
		try {
			const ref = entry.ref;

			let resolvedValue = this.getValueByKeys(obj, ref.pointer.getLocals());

			if (isJsonSchemaRef(resolvedValue)) {
				const dereferenceEntry = allEntries.find(x => x.ref.value === resolvedValue);

				if (!dereferenceEntry) {
					throw new Error('Unknown reference');
				}

				this.resolveLocalReference(obj, dereferenceEntry, allEntries, resolvedEntries);

				resolvedValue = this.getValueByKeys(obj, ref.pointer.getLocals());
			}

			this.setKey(obj, entry, resolvedValue);

			resolvedEntries.add(entry);

			// eslint-disable-next-line no-empty
		} catch {}
	}

	private setKey(obj: unknown, entry: IDereferenceEntry, value: unknown): void {
		const keys = [...entry.keys];
		const finalKey = keys.pop();

		const parent = this.getValueByKeys(obj, keys) as Record<string, unknown>;

		if (finalKey && parent && typeof parent === 'object') {
			const hasExtras = entry.ref.hasExtras();

			if (hasExtras) {
				const extras = entry.ref.getExtras();

				parent[finalKey] = Object.assign({}, value, extras, {
					[DEREFERENCE_RESOLVED_VALUE]: value,
				});
			} else {
				parent[finalKey] = value;
			}
		}
	}

	// TODO to json pointer?
	private getValueByKeys(obj: unknown, keys: string[]): unknown {
		if (!keys.length) {
			return obj;
		}

		const [head, ...rest] = keys;

		if (head == null) {
			throw new Error('Invalid reference key');
		}

		if (!rest.length) {
			if (Object.prototype.hasOwnProperty.call(obj, head)) {
				return (obj as Record<string, unknown>)[head];
			}

			throw new Error('Bad reference');
		}

		return this.getValueByKeys((obj as Record<string, unknown>)[head], rest);
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	private getAllReferences<T>(obj: T, keys: string[] = []): IDereferenceEntry[] {
		const refs: IDereferenceEntry[] = [];

		if (obj && typeof obj === 'object') {
			if (isJsonSchemaRef(obj)) {
				refs.push({
					ref: new JsonSchemaRef(obj),
					keys,
				});
			} else if (Array.isArray(obj)) {
				for (let i = 0; i < obj.length; i++) {
					const item = obj[i];

					if (item) {
						refs.push(...this.getAllReferences(item, [...keys, i.toString()]));
					}
				}
			} else {
				for (const [innerKey, value] of Object.entries(obj)) {
					refs.push(...this.getAllReferences(value, [...keys, innerKey]));
				}
			}
		}

		return refs;
	}
}
