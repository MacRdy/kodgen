import { JsonPointer } from './json-pointer';

describe('json-pointer', () => {
	it('should detect local pointer', () => {
		const pointer = new JsonPointer('#/test');

		expect(pointer.isLocal()).toBe(true);
	});
});
