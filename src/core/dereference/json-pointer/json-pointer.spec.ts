import { JsonPointer } from './json-pointer';

describe('json-pointer', () => {
	it('should detect local pointer', () => {
		const ptr = '#/test';

		const pointer = new JsonPointer(ptr);

		expect(pointer.isLocal()).toBe(true);
		expect(pointer.getLocals()).toStrictEqual(['test']);

		expect(pointer.isExternal()).toBe(false);
		expect(pointer.getLocation()).toBeUndefined();

		expect(pointer.toString()).toStrictEqual(ptr);
	});

	it('should detect external pointer', () => {
		const ptr = 'document.json#/test';

		const pointer = new JsonPointer(ptr);

		expect(pointer.isLocal()).toBe(false);
		expect(pointer.getLocals()).toStrictEqual(['test']);

		expect(pointer.isExternal()).toBe(true);
		expect(pointer.getLocation()).toBe('document.json');

		expect(pointer.toString()).toStrictEqual(ptr);
	});

	it('should keep local root pointer', () => {
		const ptr = '#';

		const pointer = new JsonPointer(ptr);

		expect(pointer.isLocal()).toBe(true);
		expect(pointer.getLocals()).toStrictEqual([]);

		expect(pointer.isExternal()).toBe(false);
		expect(pointer.getLocation()).toBeUndefined();

		expect(pointer.toString()).toStrictEqual(ptr);
	});

	it('should throw an error on empty pointer', () => {
		expect(() => new JsonPointer('')).toThrow('Invalid JSON Pointer');
	});

	it('should throw an error on invalid local pointer', () => {
		expect(() => new JsonPointer('#test')).toThrow('Invalid JSON Pointer');
	});

	it('should keep special characters correctly', () => {
		const ptr = '#/test~1/%24~0';

		const pointer = new JsonPointer(ptr);

		expect(pointer.getLocals()).toStrictEqual(['test/', '$~']);
		expect(pointer.toString()).toStrictEqual(ptr);
	});
});
