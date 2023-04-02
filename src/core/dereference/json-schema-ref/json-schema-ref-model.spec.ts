import { isJsonSchemaRef } from './json-schema-ref.model';

describe('json-schema-ref-model', () => {
	it('should detect ref model', () => {
		expect(isJsonSchemaRef({ $ref: 'ref' })).toBe(true);

		expect(isJsonSchemaRef({})).toBe(false);
		expect(isJsonSchemaRef({ $ref: 1 })).toBe(false);
		expect(isJsonSchemaRef({ $ref: '' })).toBe(false);
	});
});
