import { Storage } from './storage.service';

describe('storage', () => {
	it('should handle records correctly', () => {
		const storage = new Storage<string, number>();

		expect(storage.get('key')).not.toBeDefined();

		storage.set('key', 1);

		expect(storage.get('key')).toStrictEqual(1);

		expect(() => storage.set('key', 2)).toThrow('Key already set.');

		storage.delete('key');

		expect(storage.get('key')).not.toBeDefined();
	});
});
