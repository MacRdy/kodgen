import { HttpLoadService } from './http-load.service';

describe('http-load-service', () => {
	const service = new HttpLoadService();

	it('should detect supported paths', () => {
		expect(service.isSupported('http://example.com/swagger.json')).toBe(true);

		expect(service.isSupported('https://example.com/swagger.json')).toBe(false);

		expect(service.isSupported('swagger.json')).toBe(false);
		expect(service.isSupported('./swagger.json')).toBe(false);
		expect(service.isSupported('folder/swagger.json')).toBe(false);
	});
});
