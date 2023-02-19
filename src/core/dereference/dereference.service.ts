import { DEREFERENCE_RESOLVED_VALUE, IDereferenceEntry } from './dereference.model';
import { JsonSchemaRef } from './json-schema-ref/json-schema-ref';

export class DereferenceService {
	dereference(obj: unknown): void {
		const allEntries = this.getAllReferences(obj);
		const resolvedEntries = new Set<IDereferenceEntry>();

		for (const entry of allEntries) {
			if (resolvedEntries.has(entry)) {
				continue;
			}

			if (!JsonSchemaRef.isLocalRef(entry.refObject)) {
				return;
			}

			this.resolveReference(obj, entry, allEntries, resolvedEntries);
		}
	}

	private resolveReference(
		obj: unknown,
		entry: IDereferenceEntry,
		allEntries: IDereferenceEntry[],
		resolvedEntries: Set<IDereferenceEntry>,
	): void {
		try {
			const refData = JsonSchemaRef.parseRef(entry.refObject.$ref);

			let resolvedValue = this.getValueByKeys(obj, refData.keys);

			if (JsonSchemaRef.isRef(resolvedValue)) {
				const dereferenceEntry = allEntries.find(x => x.refObject === resolvedValue);

				if (!dereferenceEntry) {
					throw new Error('Unknown reference');
				}

				this.resolveReference(obj, dereferenceEntry, allEntries, resolvedEntries);

				resolvedValue = this.getValueByKeys(obj, refData.keys);
			}

			const childKey = entry.keys[entry.keys.length - 1];
			const parentKeys = entry.keys.slice(0, -1);

			const parent = this.getValueByKeys(obj, parentKeys) as Record<string, unknown>;

			if (childKey && parent && typeof parent === 'object') {
				const hasExtras = JsonSchemaRef.isExtendedRef(entry.refObject);

				if (hasExtras) {
					const extras = this.getExtraProperties(entry.refObject);

					parent[childKey] = Object.assign({}, resolvedValue, extras, {
						[DEREFERENCE_RESOLVED_VALUE]: resolvedValue,
					});
				} else {
					parent[childKey] = resolvedValue;
				}
			}

			resolvedEntries.add(entry);

			// eslint-disable-next-line no-empty
		} catch {}
	}

	private getExtraProperties(obj: unknown): Record<string, unknown> {
		const extras: Record<string, unknown> = {};

		if (obj && typeof obj === 'object') {
			for (const [key, value] of Object.entries(obj)) {
				if (key !== '$ref') {
					extras[key] = value;
				}
			}
		}

		return extras;
	}

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
			if (JsonSchemaRef.isRef(obj)) {
				refs.push({ refObject: obj, keys });
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
