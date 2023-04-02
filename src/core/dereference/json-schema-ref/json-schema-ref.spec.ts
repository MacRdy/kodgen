import { JsonPointer } from '../json-pointer/json-pointer';
import { JsonSchemaRef } from './json-schema-ref';

describe('json-schema-ref', () => {
	it('should create pointer after initialization', () => {
		const ref = new JsonSchemaRef({ $ref: 'ref' });

		expect(ref.pointer).toBeInstanceOf(JsonPointer);
	});

	it('should detect no extras', () => {
		const ref = new JsonSchemaRef({ $ref: 'ref' });

		expect(ref.hasExtras()).toBe(false);
		expect(ref.getExtras()).toStrictEqual({});
	});

	it('should detect extras', () => {
		const ref = new JsonSchemaRef({ $ref: 'ref', description: '1', 'x-extension': true });

		expect(ref.hasExtras()).toBe(true);
		expect(ref.getExtras()).toStrictEqual({ description: '1', 'x-extension': true });
	});
});
