import { JsonPointer } from '../json-pointer/json-pointer';
import { IJsonSchemaRef } from './json-schema-ref.model';

export class JsonSchemaRef {
	readonly pointer: JsonPointer;

	constructor(readonly value: IJsonSchemaRef) {
		this.pointer = new JsonPointer(value.$ref);
	}

	getExtras(): Record<string, unknown> {
		const extras: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(this.value)) {
			if (key !== '$ref') {
				extras[key] = value;
			}
		}

		return extras;
	}

	hasExtras(): boolean {
		return Object.keys(this.value).length > 1;
	}
}
