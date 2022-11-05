import { PathDef } from '@core/entities/schema-entities/path-def.model';
import { Hooks } from '@core/hooks/hooks';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { NgTypescriptPathService } from './ng-typescript-path.service';
import {
	generateEntityName,
	generateMethodName,
	generatePropertyName,
	INgtsPath,
} from './ng-typescript.model';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/hooks/hooks');
jest.mock('@core/utils');
jest.mock('./ng-typescript.model');

const generateEntityNameMock = jest.mocked(generateEntityName);
const generatePropertyNameMock = jest.mocked(generatePropertyName);
const generateMethodNameMock = jest.mocked(generateMethodName);
const toKebabCaseMock = jest.mocked(toKebabCase);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('ng-typescript-path', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		generateEntityNameMock.mockClear();
		generatePropertyNameMock.mockClear();
		generateMethodNameMock.mockClear();
		toKebabCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file from path def', () => {
		generateEntityNameMock.mockReturnValueOnce('MyApi');
		toKebabCaseMock.mockReturnValueOnce('my-api');
		generateMethodNameMock.mockReturnValueOnce('apiGet');

		const pathDef = new PathDef(
			'/api',
			'GET',
			undefined,
			undefined,
			undefined,
			undefined,
			['myApi'],
			{ 'x-custom': true },
		);

		const registry = new ImportRegistryService();
		const service = new NgTypescriptPathService(registry);

		const result = service.generate([pathDef]);

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('services/my-api.service');
		expect(resultFile.template).toStrictEqual('service');

		const path: INgtsPath = {
			name: 'apiGet',
			isMultipart: false,
			method: 'GET',
			urlPattern: '/api',
			responseType: 'void',
			dependencies: [],
			extensions: { 'x-custom': true },
			requestBodyType: undefined,
			requestPathParameters: undefined,
			requestQueryParametersMapping: undefined,
			requestQueryParametersType: undefined,
		};

		expect(resultFile.templateData).toBeDefined();

		expect(resultFile.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile.templateData!.paths).toStrictEqual([path]);

		expect(resultFile.templateData!.getImportEntries).toBeDefined();
		expect(resultFile.templateData!.parametrizeUrlPattern).toBeDefined();
	});
});
