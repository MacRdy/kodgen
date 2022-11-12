import {
	PathDef,
	PathParametersObjectModelDef,
	PathRequestBody,
	PathResponse,
	QueryParametersObjectModelDef,
} from '@core/entities/schema-entities/path-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { Hooks } from '@core/hooks/hooks';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';
import {
	generateEntityName,
	generateMethodName,
	generatePropertyName,
	ITsModelProperty,
	ITsPath,
} from './typescript-generator.model';
import { testingTypescriptGeneratorConfig } from './typescript-generator.service.spec';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/hooks/hooks');
jest.mock('@core/utils');
jest.mock('./typescript-generator-model.service');
jest.mock('./typescript-generator.model');

const generateEntityNameMock = jest.mocked(generateEntityName);
const generatePropertyNameMock = jest.mocked(generatePropertyName);
const generateMethodNameMock = jest.mocked(generateMethodName);
const toKebabCaseMock = jest.mocked(toKebabCase);
const ngTypescriptModelServiceMock = jest.mocked(TypescriptGeneratorModelService);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('typescript-generator-path', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		generateEntityNameMock.mockClear();
		generatePropertyNameMock.mockClear();
		generateMethodNameMock.mockClear();
		toKebabCaseMock.mockClear();
		ngTypescriptModelServiceMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file (simple)', () => {
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
			undefined,
			undefined,
			{ 'x-custom': true },
		);

		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorPathService(
			registry,
			testingTypescriptGeneratorConfig,
		);

		const result = service.generate([pathDef]);

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('services/my-api.service');
		expect(resultFile.template).toStrictEqual('service');

		const path: ITsPath = {
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

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile.templateData!.paths).toStrictEqual([path]);

		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile.templateData!.parametrizeUrlPattern).toBeTruthy();
	});

	it('should generate file (with parameters)', () => {
		generateEntityNameMock.mockReturnValueOnce('MyApi');
		toKebabCaseMock.mockReturnValueOnce('my-api');
		generateMethodNameMock.mockReturnValueOnce('apiGet');
		generatePropertyNameMock.mockReturnValueOnce('queryParam1');

		const pathParameters = new PathParametersObjectModelDef(
			'/api get Request Path Parameters',
			[new Property('PathParam1', new SimpleModelDef('string'), true, true, false, false)],
		);

		const queryParameters = new QueryParametersObjectModelDef(
			'/api get Request Query Parameters',
			[
				new Property(
					'QueryParam1',
					new SimpleModelDef('integer', 'int32'),
					true,
					true,
					false,
					false,
				),
			],
		);

		const pathDef = new PathDef(
			'/api',
			'GET',
			pathParameters,
			queryParameters,
			undefined,
			undefined,
			['myApi'],
			undefined,
			undefined,
			{ 'x-custom': true },
		);

		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorPathService(
			registry,
			testingTypescriptGeneratorConfig,
		);

		const ngTsProperties: ITsModelProperty[] = [
			{
				name: 'pathParam1',
				type: 'string',
				required: true,
				nullable: true,
				dependencies: [],
			},
		];

		const modelServiceMock = jest.mocked(ngTypescriptModelServiceMock.mock.instances[0]);

		modelServiceMock?.getProperties.mockReturnValueOnce(ngTsProperties);

		modelServiceMock?.resolvePropertyType.mockReturnValueOnce(
			'/api get Request Query Parameters',
		);

		const result = service.generate([pathDef]);

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('services/my-api.service');
		expect(resultFile.template).toStrictEqual('service');

		const path: ITsPath = {
			name: 'apiGet',
			isMultipart: false,
			method: 'GET',
			urlPattern: '/api',
			responseType: 'void',
			dependencies: ['/api get Request Query Parameters'],
			extensions: { 'x-custom': true },
			requestBodyType: undefined,
			requestPathParameters: ngTsProperties,
			requestQueryParametersMapping: [['QueryParam1', 'queryParam1']],
			requestQueryParametersType: '/api get Request Query Parameters',
		};

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile.templateData!.paths).toStrictEqual([path]);

		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile.templateData!.parametrizeUrlPattern).toBeTruthy();
	});

	it('should generate file (with body and response)', () => {
		generateEntityNameMock.mockReturnValueOnce('MyApi');
		toKebabCaseMock.mockReturnValueOnce('my-api');
		generateMethodNameMock.mockReturnValueOnce('apiPost');

		const requestBody = new PathRequestBody('application/json', new SimpleModelDef('string'));

		const responseDef = new SimpleModelDef('boolean');
		const response = new PathResponse('200', 'application/json', responseDef);

		const pathDef = new PathDef(
			'/api',
			'POST',
			undefined,
			undefined,
			[requestBody],
			[response],
			['myApi'],
			undefined,
			undefined,
			{ 'x-custom': true },
		);

		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorPathService(
			registry,
			testingTypescriptGeneratorConfig,
		);

		const modelServiceMock = jest.mocked(ngTypescriptModelServiceMock.mock.instances[0]);

		modelServiceMock?.resolvePropertyType.mockReturnValueOnce('string');

		modelServiceMock?.resolvePropertyDef.mockReturnValueOnce(responseDef);
		modelServiceMock?.resolvePropertyType.mockReturnValueOnce('boolean');

		const result = service.generate([pathDef]);

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('services/my-api.service');
		expect(resultFile.template).toStrictEqual('service');

		const path: ITsPath = {
			name: 'apiPost',
			isMultipart: false,
			method: 'POST',
			urlPattern: '/api',
			responseType: 'boolean',
			dependencies: [],
			extensions: { 'x-custom': true },
			requestBodyType: 'string',
			requestPathParameters: undefined,
			requestQueryParametersMapping: undefined,
			requestQueryParametersType: undefined,
		};

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile.templateData!.paths).toStrictEqual([path]);

		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile.templateData!.parametrizeUrlPattern).toBeTruthy();
	});
});
