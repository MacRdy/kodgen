import { FileService } from '../../file/file.service';
import { FileLoadService } from './file-load.service';

jest.mock('../../file/file.service');

const fileServiceMock = jest.mocked(FileService);

describe('file-load-service', () => {
	const service = new FileLoadService();

	beforeEach(() => {
		fileServiceMock.prototype.readFile.mockClear();
	});

	it('should detect supported paths', () => {
		expect(service.isSupported('http://example.com/swagger.json')).toBe(false);

		expect(service.isSupported('https://example.com/swagger.json')).toBe(false);

		expect(service.isSupported('swagger.json')).toBe(true);
		expect(service.isSupported('./swagger.json')).toBe(true);
		expect(service.isSupported('folder/swagger.json')).toBe(true);
	});

	it('should read file via FileService', async () => {
		await service.load('swagger.json');

		expect(fileServiceMock.prototype.readFile).toBeCalledWith('swagger.json');
	});
});
