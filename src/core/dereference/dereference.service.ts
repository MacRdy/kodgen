import { ORIGINAL_REF_MODEL } from '../parser/parser.model';
import { IDereferenceEntry } from './dereference.model';
import { JsonSchemaRef } from './json-ref/json-schema-ref';

export class DereferenceService {
	dereference(obj: unknown): void {
		const refs = this.getAllReferences(obj).sort((a, b) => b.keys.length - a.keys.length);

		for (const ref of refs) {
			this.resolveReference(obj, ref);
		}
	}

	private resolveReference(obj: unknown, ref: IDereferenceEntry): void {
		const refData = JsonSchemaRef.parseRef(ref.refObject.$ref);

		const resolvedValue = this.getObjectValueByKeys(obj, refData.keys);

		const referenceChildKey = ref.keys[ref.keys.length - 1];
		const parentKeys = ref.keys.slice(0, -1);

		const parent = this.getObjectValueByKeys(obj, parentKeys) as Record<string, unknown>;

		if (referenceChildKey && parent && typeof parent === 'object') {
			const extras = this.getExtraProperties(ref.refObject);
			const hasExtras = Object.keys(extras).length > 0;

			if (hasExtras) {
				parent[referenceChildKey] = Object.assign({}, resolvedValue, extras, {
					[ORIGINAL_REF_MODEL]: resolvedValue,
				});
			} else {
				parent[referenceChildKey] = resolvedValue;
			}
		}
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

	private getObjectValueByKeys(obj: unknown, keys: string[]): unknown {
		try {
			if (!keys.length) {
				return obj;
			}

			const [head, ...rest] = keys;

			if (head == null) {
				throw new Error('Invalid reference key');
			}

			if (!rest.length && Object.prototype.hasOwnProperty.call(obj, head)) {
				return (obj as Record<string, unknown>)[head];
			}

			return this.getObjectValueByKeys((obj as Record<string, unknown>)[head], rest);
		} catch {
			if (!keys.length) {
				throw new Error('Reference keys not defined');
			}

			throw new Error(`Unreachable reference: ${keys.join(' -> ')}`);
		}
	}

	private getAllReferences<T>(obj: T, keys: string[] = []): IDereferenceEntry[] {
		const refs: IDereferenceEntry[] = [];

		if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
			if (JsonSchemaRef.isRef(obj)) {
				refs.push({ refObject: obj, keys });
			} else {
				for (const [innerKey, value] of Object.entries(obj)) {
					if (Array.isArray(value)) {
						for (let i = 0; i < value.length; i++) {
							const item = value[i];

							if (item && typeof item === 'object') {
								refs.push(
									...this.getAllReferences(item, [
										...keys,
										innerKey,
										i.toString(),
									]),
								);
							}
						}
					} else if (value && typeof value === 'object') {
						refs.push(...this.getAllReferences(value, [...keys, innerKey]));
					}
				}
			}
		}

		return refs;
	}
}
