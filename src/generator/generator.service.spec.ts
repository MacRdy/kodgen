import pathLib from 'path';
import { FileService } from '../core/file/file.service';
import { RendererService } from '../core/renderer/renderer.service';
import {
	IGenerator,
	IGeneratorFile,
	IGeneratorPackage,
	isGenerator,
	isGeneratorPackage,
} from './generator.model';
import { GeneratorService } from './generator.service';

jest.mock('path');
jest.mock('../core/renderer/renderer.service');
jest.mock('../core/file/file.service');
jest.mock('../core/printer/printer');
jest.mock('./generator.model');

const pathMock = jest.mocked(pathLib);
const fileServiceMock = jest.mocked(FileService);
const rendererServiceMock = jest.mocked(RendererService);
const isGeneratorMock = jest.mocked(isGenerator);
const isGeneratorPackageMock = jest.mocked(isGeneratorPackage);

describe('generator-service', () => {
	beforeEach(() => {
		pathMock.join.mockReset();
		fileServiceMock.mockReset();
		rendererServiceMock.mockReset();

		isGeneratorMock.mockReset();
		isGeneratorPackageMock.mockReset();
	});

	it('should find correct generator', () => {
		const generator: IGenerator = {
			getName(): string {
				return 'generator-name';
			},
			getTemplateDir(): string {
				return '';
			},
			generate(): IGeneratorFile[] {
				return [];
			},
		};

		const generatorPackage: IGeneratorPackage = {
			generators: [generator],
		};

		const service = new GeneratorService();

		const fileServiceInstance = fileServiceMock.mock.instances[0];
		jest.mocked(fileServiceInstance?.loadModule)?.mockReturnValueOnce(generatorPackage);

		isGeneratorPackageMock.mockReturnValueOnce(true);
		isGeneratorMock.mockReturnValueOnce(true);

		const result = service.get('package', 'generator-name');

		expect(result).toBe(generator);

		expect(isGeneratorPackage).toBeCalledTimes(1);
		expect(isGenerator).toBeCalledTimes(1);
	});

	it('should not find correct generator', () => {
		const service = new GeneratorService();

		const fileServiceInstance = fileServiceMock.mock.instances[0];
		jest.mocked(fileServiceInstance?.loadModule)?.mockReturnValueOnce(null);

		isGeneratorPackageMock.mockReturnValueOnce(false);

		expect(() => service.get('package', 'some-generator-name-to-throw')).toThrow(
			'Invalid generator package',
		);
	});

	it('should build simple configuration', async () => {
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

		await service.build('./templates', files, { output: './output' });

		expect(pathMock.join).nthCalledWith(1, './templates', 'template.ext');
		expect(pathMock.join).nthCalledWith(2, './output', './file');
		expect(pathMock.join).toBeCalledTimes(2);

		expect(rendererInstanceMock?.render).lastCalledWith('./templates/template.ext', {
			k: undefined,
			d: undefined,
		});

		expect(fsInstanceMock?.createFile).lastCalledWith('./output/file', 'rendered template');

		expect(fsInstanceMock?.removeDirectory).not.toHaveBeenCalled();
		expect(fsInstanceMock?.loadFile).not.toHaveBeenCalled();
		expect(fsInstanceMock?.exists).not.toHaveBeenCalled();
	});

	it('should build complex configuration', async () => {
		const service = new GeneratorService();

		const fsInstanceMock = jest.mocked(fileServiceMock.mock.instances[0]);

		const rendererInstanceMock = jest.mocked(rendererServiceMock.mock.instances[0]);
		rendererInstanceMock?.getExtension.mockReturnValue('.ext');

		const additionalTemplateData = { var1: 'var1' };
		fsInstanceMock?.loadFile.mockResolvedValueOnce(additionalTemplateData);

		pathMock.join.mockReturnValueOnce('./custom-templates/template.ext');

		fsInstanceMock?.exists.mockReturnValueOnce(true);

		rendererInstanceMock?.render.mockResolvedValue('rendered template');

		pathMock.join.mockReturnValueOnce('./output/file');

		const files: IGeneratorFile[] = [
			{
				path: './file',
				template: 'template',
			},
		];

		await service.build('./templates', files, {
			output: './output',
			clean: true,
			templateDataFile: './template-data.js',
			templateDir: './custom-templates',
		});

		expect(fsInstanceMock?.removeDirectory).toHaveBeenCalledTimes(1);
		expect(fsInstanceMock?.removeDirectory).toHaveBeenCalledWith('./output');

		expect(fsInstanceMock?.loadFile).toHaveBeenCalledTimes(1);
		expect(fsInstanceMock?.loadFile).toHaveBeenCalledWith('./template-data.js');

		expect(fsInstanceMock?.exists).toHaveBeenCalledTimes(1);
		expect(fsInstanceMock?.exists).toHaveBeenCalledWith('./custom-templates/template.ext');

		expect(pathMock.join).nthCalledWith(1, './custom-templates', 'template.ext');
		expect(pathMock.join).nthCalledWith(2, './output', './file');
		expect(pathMock.join).toBeCalledTimes(2);

		expect(rendererInstanceMock?.render).lastCalledWith('./custom-templates/template.ext', {
			k: undefined,
			d: additionalTemplateData,
		});

		expect(fsInstanceMock?.createFile).lastCalledWith('./output/file', 'rendered template');
	});
});
