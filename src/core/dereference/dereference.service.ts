import { DEREFERENCE_RESOLVED_VALUE, IDereferenceEntry } from './dereference.model';
import { JsonSchemaRef } from './json-ref/json-schema-ref';

export class DereferenceService {
	dereference(obj: unknown): void {
		const refs = this.getAllReferences(obj);

		for (const ref of refs) {
			this.resolveReference(obj, ref);
		}
	}

	private resolveReference(obj: unknown, ref: IDereferenceEntry): void {
		if (!JsonSchemaRef.isLocalRef(ref.refObject)) {
			return;
		}

		const refData = JsonSchemaRef.parseRef(ref.refObject.$ref);

		const resolvedValue = this.getObjectValueByKeys(obj, refData.keys);

		const childKey = ref.keys[ref.keys.length - 1];
		const parentKeys = ref.keys.slice(0, -1);

		const parent = this.getObjectValueByKeys(obj, parentKeys) as Record<string, unknown>;

		if (childKey && parent && typeof parent === 'object') {
			const hasExtras = JsonSchemaRef.isExtendedRef(ref.refObject);

			if (hasExtras) {
				const extras = this.getExtraProperties(ref.refObject);

				parent[childKey] = Object.assign({}, resolvedValue, extras, {
					[DEREFERENCE_RESOLVED_VALUE]: resolvedValue,
				});
			} else {
				parent[childKey] = resolvedValue;
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
			// TODO catch?
			throw new Error(`Unreachable reference: '${keys.join("' -> '")}'`);
		}
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
