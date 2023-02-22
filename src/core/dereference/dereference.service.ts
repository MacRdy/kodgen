import { DEREFERENCE_RESOLVED_VALUE, IDereferenceEntry } from './dereference.model';
import { JsonSchemaRef } from './json-schema-ref/json-schema-ref';
import { isJsonSchemaRef } from './json-schema-ref/json-schema-ref.model';

export class DereferenceService {
	dereference(obj: unknown): void {
		const allEntries = this.getAllReferences(obj);
		const resolvedEntries = new Set<IDereferenceEntry>();

		for (const entry of allEntries) {
			if (resolvedEntries.has(entry)) {
				continue;
			}

			if (!entry.ref.pointer.isLocal()) {
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
			const ref = entry.ref;

			let resolvedValue = this.getValueByKeys(obj, ref.pointer.getLocals());

			if (isJsonSchemaRef(resolvedValue)) {
				const dereferenceEntry = allEntries.find(x => x.ref.value === resolvedValue);

				if (!dereferenceEntry) {
					throw new Error('Unknown reference');
				}

				this.resolveReference(obj, dereferenceEntry, allEntries, resolvedEntries);

				resolvedValue = this.getValueByKeys(obj, ref.pointer.getLocals());
			}

			const keys = [...entry.keys];
			const finalKey = keys.pop();

			const parent = this.getValueByKeys(obj, keys) as Record<string, unknown>;

			if (finalKey && parent && typeof parent === 'object') {
				const hasExtras = ref.hasExtras();

				if (hasExtras) {
					const extras = ref.getExtras();

					parent[finalKey] = Object.assign({}, resolvedValue, extras, {
						[DEREFERENCE_RESOLVED_VALUE]: resolvedValue,
					});
				} else {
					parent[finalKey] = resolvedValue;
				}
			}

			resolvedEntries.add(entry);

			// eslint-disable-next-line no-empty
		} catch {}
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
