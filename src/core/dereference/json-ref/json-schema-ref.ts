import { IJsonSchemaRef, IJsonSchemaRefData } from './json-schema-ref.model';

export class JsonSchemaRef {
	static ROOT_TOKEN = '#/';

	static isRef(obj: unknown): obj is IJsonSchemaRef {
		return (
			!!obj &&
			typeof obj === 'object' &&
			typeof (obj as IJsonSchemaRef).$ref === 'string' &&
			!!(obj as IJsonSchemaRef).$ref
		);
	}

	static isLocalRef(obj: IJsonSchemaRef): boolean {
		return obj.$ref.startsWith('#/') || obj.$ref === '#';
	}

	static isExternalRef(obj: IJsonSchemaRef): boolean {
		return !obj.$ref.startsWith('#');
	}

	static isExtendedRef(obj: IJsonSchemaRef): boolean {
		return Object.keys(obj).length > 1;
	}

	static isValidRef(obj: unknown): obj is IJsonSchemaRef {
		return this.isRef(obj) && (this.isLocalRef(obj) || this.isExternalRef(obj));
	}

	static parseRef(ref: string): IJsonSchemaRefData {
		if (!ref) {
			throw new Error('Invalid $ref');
		}

		const [source, path] = ref.split(this.ROOT_TOKEN);

		const keys = path
			?.split('/')
			.map(decodeURIComponent)
			.map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'));

		return {
			source: source ? source : undefined,
			keys: keys ?? [],
		};
	}

	static keysToRef(keys: string[], source?: string): string {
		const path = keys
			.map(x => x.replace(/\//g, '~1').replace(/~/g, '~0'))
			.map(encodeURIComponent)
			.join('/');

		return `${source}#/${path}`;
	}
}
