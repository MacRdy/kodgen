import { load } from 'js-yaml';
import { FileLoadService } from './file/file-load.service';
import { HttpLoadService } from './http/http-load.service';
import { HttpsLoadService } from './https/https-load.service';
import { LoadService } from './load.service';

jest.mock('js-yaml');

jest.mock('./http/http-load.service');
jest.mock('./https/https-load.service');
jest.mock('./file/file-load.service');

const jsYamlLoadMock = jest.mocked(load);

const httpLoadServiceGlobalMock = jest.mocked(HttpLoadService);
const httpsLoadServiceGlobalMock = jest.mocked(HttpsLoadService);
const fileLoadServiceGlobalMock = jest.mocked(FileLoadService);

describe('load-service', () => {
	beforeEach(() => {
		jsYamlLoadMock.mockReset();

		httpLoadServiceGlobalMock.mockReset();
		httpLoadServiceGlobalMock.prototype.isSupported.mockReset();

		httpsLoadServiceGlobalMock.mockReset();
		httpsLoadServiceGlobalMock.prototype.isSupported.mockReset();

		fileLoadServiceGlobalMock.mockReset();
		fileLoadServiceGlobalMock.prototype.isSupported.mockReset();
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

	describe('normalize-path', () => {
		const service = new LoadService();

		describe('should resolve local paths', () => {
			it('one level with previous', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);

				const x = service.normalizePath('external.json', 'swagger.json');

				expect(x).toStrictEqual('external.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('with inner directory', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);

				const x = service.normalizePath('dir/external.json', 'swagger.json');

				expect(x).toStrictEqual('dir/external.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('with inner and outer directories', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);

				const x = service.normalizePath('dir2/external2.json', 'dir1/external1.json');

				expect(x).toStrictEqual('dir1/dir2/external2.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('with outer directory', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);

				const x = service.normalizePath('../swagger.json', 'dir/external.json');

				expect(x).toStrictEqual('swagger.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('with another file in directory', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);

				const x = service.normalizePath('swagger.json', 'dir/external.json');

				expect(x).toStrictEqual('dir/swagger.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});
		});

		describe('should resolve external paths', () => {
			it('with another file in directory', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(false);

				const x = service.normalizePath('external.json', 'http://example.com/swagger.json');

				expect(x).toStrictEqual('http://example.com/external.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('with inner directory', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(false);

				const x = service.normalizePath(
					'dir/external.json',
					'http://example.com/swagger.json',
				);

				expect(x).toStrictEqual('http://example.com/dir/external.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('with another host', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(false);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(false);

				const x = service.normalizePath(
					'https://another-example.com/swagger.json',
					'http://example.com/swagger.json',
				);

				expect(x).toStrictEqual('https://another-example.com/swagger.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('without protocol', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(false);

				const x = service.normalizePath(
					'//another-example.com/swagger.json',
					'http://example.com/swagger.json',
				);

				expect(x).toStrictEqual('http://another-example.com/swagger.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});

			it('from local to external', () => {
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(false);
				fileLoadServiceGlobalMock.prototype.isSupported.mockReturnValueOnce(true);

				const x = service.normalizePath('https://example.com/swagger.json', 'swagger.json');

				expect(x).toStrictEqual('https://example.com/swagger.json');
				expect(fileLoadServiceGlobalMock.prototype.isSupported).toBeCalledTimes(2);
			});
		});
	});
});
