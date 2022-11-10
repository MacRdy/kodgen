import { IGeneratorFile } from '@generators/generator.model';
import { NgTypescriptGeneratorService } from '@generators/ng-typescript/ng-typescript-generator.service'; // TODO check import
import pathLib from 'path';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';

jest.mock('./ng-typescript-enum.service');
jest.mock('./ng-typescript-model.service');
jest.mock('./ng-typescript-path.service');

const enumServiceMock = jest.mocked(TypescriptGeneratorEnumService);
const modelServiceMock = jest.mocked(TypescriptGeneratorModelService);
const pathServiceMock = jest.mocked(TypescriptGeneratorPathService);

describe('typescript-generator', () => {
	beforeEach(() => {
		enumServiceMock.mockClear();
		modelServiceMock.mockClear();
		pathServiceMock.mockClear();
	});

	it('should return name', () => {
		const service = new NgTypescriptGeneratorService();

		expect(service.getName()).toStrictEqual('ng-typescript');
	});

	it('should return template folder', () => {
		const service = new NgTypescriptGeneratorService();

		expect(service.getTemplateDir()).toStrictEqual(pathLib.join(__dirname, 'templates'));
	});

	it('should generate files', () => {
		const service = new NgTypescriptGeneratorService();

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
