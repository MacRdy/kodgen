import { IGeneratorFile } from '@generators/generator.model';
import pathLib from 'path';
import { NgTypescriptEnumService } from './ng-typescript-enum.service';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import { NgTypescriptPathService } from './ng-typescript-path.service';
import { NgTypescriptService } from './ng-typescript.service';

jest.mock('./ng-typescript-enum.service');
jest.mock('./ng-typescript-model.service');
jest.mock('./ng-typescript-path.service');

const enumServiceMock = jest.mocked(NgTypescriptEnumService);
const modelServiceMock = jest.mocked(NgTypescriptModelService);
const pathServiceMock = jest.mocked(NgTypescriptPathService);

describe('ng-typescript', () => {
	beforeEach(() => {
		enumServiceMock.mockClear();
		modelServiceMock.mockClear();
		pathServiceMock.mockClear();
	});

	it('should return name', () => {
		const service = new NgTypescriptService();

		expect(service.getName()).toStrictEqual('ng-typescript');
	});

	it('should return template folder', () => {
		const service = new NgTypescriptService();

		expect(service.getTemplateDir()).toStrictEqual(pathLib.join(__dirname, 'templates'));
	});

	it('should generate files', () => {
		const service = new NgTypescriptService();

		const enumFile: IGeneratorFile = {
			path: './enums/enum',
			template: 'enum',
		};

		const modelFile: IGeneratorFile = {
			path: './models/model',
			template: 'model',
		};

		const pathFile: IGeneratorFile = {
			path: './services/service',
			template: 'service',
		};

		jest.mocked(enumServiceMock.mock.instances[0])?.generate.mockReturnValue([enumFile]);
		jest.mocked(modelServiceMock.mock.instances[0])?.generate.mockReturnValue([modelFile]);
		jest.mocked(pathServiceMock.mock.instances[0])?.generate.mockReturnValue([pathFile]);

		const result = service.generate({ enums: [], models: [], paths: [] });

		const expected: IGeneratorFile[] = [
			{
				...enumFile,
				path: './enums/enum.ts',
			},
			{
				...modelFile,
				path: './models/model.ts',
			},
			{
				...pathFile,
				path: './services/service.ts',
			},
		];

		expect(result).toStrictEqual(expected);
	});
});
