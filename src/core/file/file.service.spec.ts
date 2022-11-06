import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { FileService } from './file.service';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('path');

const fsMock = jest.mocked(fs);
const fsPromisesMock = jest.mocked(fsPromises);
const pathMock = jest.mocked(path);

describe('file', () => {
	beforeEach(() => {
		pathMock.dirname.mockClear();

		fsMock.existsSync.mockClear();

		fsPromisesMock.mkdir.mockClear();
		fsPromisesMock.readFile.mockClear();
		fsPromisesMock.writeFile.mockClear();
		fsPromisesMock.rm.mockClear();
	});

	it('should check dir existence', () => {
		const fileService = new FileService();

		const dir = './dir';

		fileService.exists(dir);

		expect(fsMock.existsSync).toBeCalledWith(dir);
	});

	it('should make dir and create file', async () => {
		const fileService = new FileService();

		const filePath = './dir/file.ext';
		const fileDir = './dir';
		const fileContent = 'file-content';

		pathMock.dirname.mockReturnValueOnce(fileDir);
		fsMock.existsSync.mockReturnValueOnce(false);

		await fileService.createFile(filePath, fileContent);

		expect(path.dirname).toBeCalledWith(filePath);
		expect(fs.existsSync).toBeCalledWith(fileDir);
		expect(fsPromises.mkdir).toBeCalledWith(fileDir, { recursive: true });
		expect(fsPromises.writeFile).toBeCalledWith(filePath, fileContent, { flag: 'w' });
	});

	it('should create file (dir exists)', async () => {
		const fileService = new FileService();

		const filePath = './dir/file.ext';
		const fileDir = './dir';
		const fileContent = 'file-content';

		pathMock.dirname.mockReturnValueOnce(fileDir);
		fsMock.existsSync.mockReturnValueOnce(true);

		await fileService.createFile(filePath, fileContent);

		expect(path.dirname).toBeCalledWith(filePath);
		expect(fs.existsSync).toBeCalledWith(fileDir);
		expect(fsPromises.mkdir).not.toHaveBeenCalled();
		expect(fsPromises.writeFile).toBeCalledWith(filePath, fileContent, { flag: 'w' });
	});

	it('should remove directory', async () => {
		const fileService = new FileService();

		const dir = '/dir/sub-dir';

		await fileService.removeDirectory(dir);

		expect(fsPromises.rm).toBeCalledWith(dir, { recursive: true, force: true });
	});

	it('should read file', async () => {
		const fileService = new FileService();

		const filePath = './dir/file.ext';
		const fileContent = 'fileContent';

		fsPromisesMock.readFile.mockResolvedValueOnce(fileContent);

		const result = await fileService.readFile(filePath);

		expect(fsPromises.readFile).toBeCalledWith(filePath);
		expect(result).toStrictEqual(fileContent);
	});

	it('should load json file', async () => {
		const fileService = new FileService();

		const filePath = './dir/file.json';
		const fileContent = 'fileContent';

		fsPromisesMock.readFile.mockResolvedValueOnce(Buffer.from(''));

		const jsonParseSpy = jest.spyOn(JSON, 'parse');
		jsonParseSpy.mockReturnValueOnce(fileContent);

		const result = await fileService.loadJson<string>(filePath);

		expect(fsPromises.readFile).toBeCalledWith(filePath);
		expect(JSON.parse).toHaveBeenCalledTimes(1);
		expect(result).toStrictEqual(fileContent);

		jsonParseSpy.mockRestore();
	});
});
