import { HttpsLoadService } from './https-load.service';

describe('https-load-service', () => {
	const service = new HttpsLoadService();

	it('should detect supported paths', () => {
		expect(service.isSupported('http://example.com/swagger.json')).toBe(false);

		expect(service.isSupported('https://example.com/swagger.json')).toBe(true);

		expect(service.isSupported('swagger.json')).toBe(false);
		expect(service.isSupported('./swagger.json')).toBe(false);
		expect(service.isSupported('folder/swagger.json')).toBe(false);
	});
});
