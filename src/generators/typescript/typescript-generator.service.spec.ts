import { toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';
import { ITsGeneratorConfig } from './typescript-generator.model';
import { TypescriptGeneratorService } from './typescript-generator.service';

jest.mock('./typescript-generator-enum.service');
jest.mock('./typescript-generator-model.service');
jest.mock('./typescript-generator-path.service');

export const testingTypescriptGeneratorConfig: ITsGeneratorConfig = {
	enumDir: 'enums',
	enumFileNameResolver: name => toKebabCase(name),
	enumTemplate: 'enum',
	modelDir: 'models',
	modelFileNameResolver: name => toKebabCase(name),
	modelTemplate: 'model',
	pathDir: 'services',
	pathFileNameResolver: name => `${toKebabCase(name)}.service`,
	pathTemplate: 'service',
};

class TestingTypescriptGeneratorService extends TypescriptGeneratorService {
	getName(): string {
		return 'typescript';
	}

	getTemplateDir(): string {
		throw new Error('Method not implemented.');
	}

	constructor() {
		super(testingTypescriptGeneratorConfig);
	}
}

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
		const service = new TestingTypescriptGeneratorService();

		expect(service.getName()).toStrictEqual('typescript');
	});

	it('should generate files', () => {
		const service = new TestingTypescriptGeneratorService();

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
