import { Config } from '@core/config/config';
import { FileService } from '@core/file/file.service';
import { RendererService } from '@core/renderer/renderer.service';
import pathLib from 'path';
import { IGeneratorFile } from './generator.model';
import { GeneratorService } from './generator.service';
import { NgTypescriptService } from './ng-typescript/ng-typescript.service';

jest.mock('path');
jest.mock('@core/renderer/renderer.service');
jest.mock('@core/file/file.service');
jest.mock('./ng-typescript/ng-typescript.service');

const pathMock = jest.mocked(pathLib);
const fileServiceMock = jest.mocked(FileService);
const rendererServiceMock = jest.mocked(RendererService);
const ngTypescriptGeneratorMock = jest.mocked(NgTypescriptService);

describe('generator', () => {
	beforeEach(() => {
		pathMock.join.mockClear();
		fileServiceMock.mockClear();
		rendererServiceMock.mockClear();
		ngTypescriptGeneratorMock.mockClear();
	});

	it('should find correct generator', () => {
		const service = new GeneratorService();

		const generator = ngTypescriptGeneratorMock.mock.instances[0];

		jest.mocked(generator)?.getName.mockReturnValue('generator-name');

		const result = service.get('generator-name');

		expect(result).toBe(generator);
	});

	it('should build simple configuration', async () => {
		const configGetSpy = jest.spyOn(Config, 'get');

		configGetSpy.mockReturnValueOnce({
			generator: '',
			input: '',
			output: './output',
		});

		const service = new GeneratorService();

		const fsInstanceMock = jest.mocked(fileServiceMock.mock.instances[0]);

		const rendererInstanceMock = jest.mocked(rendererServiceMock.mock.instances[0]);
		rendererInstanceMock?.getExtension.mockReturnValue('.ext');

		pathMock.join.mockReturnValueOnce('./templates/template.ext');

		rendererInstanceMock?.render.mockResolvedValue('rendered template');

		pathMock.join.mockReturnValueOnce('./output/file');

		const files: IGeneratorFile[] = [
			{
				path: './file',
				template: 'template',
			},
		];

		await service.build('./templates', files);

		expect(pathMock.join).nthCalledWith(1, './templates', 'template.ext');
		expect(pathMock.join).nthCalledWith(2, './output', './file');
		expect(pathMock.join).toBeCalledTimes(2);

		expect(rendererInstanceMock?.render).lastCalledWith('./templates/template.ext', undefined);
		expect(fsInstanceMock?.createFile).lastCalledWith('./output/file', 'rendered template');

		expect(fsInstanceMock?.removeDirectory).not.toHaveBeenCalled();
		expect(fsInstanceMock?.loadJson).not.toHaveBeenCalled();
		expect(fsInstanceMock?.loadJs).not.toHaveBeenCalled();
		expect(fsInstanceMock?.exists).not.toHaveBeenCalled();

		configGetSpy.mockRestore();
	});
});
