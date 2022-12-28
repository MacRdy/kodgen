import { load } from 'js-yaml';
import { FileLoadService } from './file-load.service';
import { HttpLoadService } from './http-load.service';
import { HttpsLoadService } from './https-load.service';
import { LoadService } from './load.service';

jest.mock('js-yaml');

jest.mock('./http-load.service');
jest.mock('./https-load.service');
jest.mock('./file-load.service');

const jsYamlLoadMock = jest.mocked(load);

const httpLoadServiceGlobalMock = jest.mocked(HttpLoadService);
const httpsLoadServiceGlobalMock = jest.mocked(HttpsLoadService);
const fileLoadServiceGlobalMock = jest.mocked(FileLoadService);

describe('load', () => {
	beforeEach(() => {
		jsYamlLoadMock.mockClear();

		httpLoadServiceGlobalMock.mockClear();
		httpLoadServiceGlobalMock.prototype.isSupported.mockClear();

		httpsLoadServiceGlobalMock.mockClear();
		httpsLoadServiceGlobalMock.prototype.isSupported.mockClear();

		fileLoadServiceGlobalMock.mockClear();
		fileLoadServiceGlobalMock.prototype.isSupported.mockClear();
	});

	it('should throw an error with unknown path', async () => {
		const service = new LoadService();

		await expect(service.load('protocol://example')).rejects.toThrow(
			'Resource could not be loaded',
		);
	});

	it('should load resource', async () => {
		const service = new LoadService();

		httpsLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
		httpsLoadServiceGlobalMock.prototype.load.mockResolvedValueOnce(Buffer.from('', 'utf-8'));

		await service.load('example');

		expect(httpLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(1);
		expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(1);

		expect(httpsLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(1);
		expect(httpsLoadServiceGlobalMock.prototype.isSupported).toBeCalledWith('example');

		expect(httpsLoadServiceGlobalMock.prototype.load).toBeCalledTimes(1);
		expect(httpsLoadServiceGlobalMock.prototype.load).toBeCalledWith('example', undefined);

		expect(jsYamlLoadMock).toBeCalledTimes(1);
	});
});
