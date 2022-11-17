import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
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
import { Storage } from '@core/storage/storage.service';
import { toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';
import {
	generateEntityName,
	generateMethodName,
	generatePropertyName,
	ITsModel,
	ITsPath,
} from './typescript-generator.model';
import { testingTypescriptGeneratorConfig } from './typescript-generator.service.spec';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/storage/storage.service');
jest.mock('@core/hooks/hooks');
jest.mock('@core/utils');
jest.mock('./typescript-generator-model.service');
jest.mock('./typescript-generator.model');

const generateEntityNameMock = jest.mocked(generateEntityName);
const generatePropertyNameMock = jest.mocked(generatePropertyName);
const generateMethodNameMock = jest.mocked(generateMethodName);
const toKebabCaseMock = jest.mocked(toKebabCase);
const ngTypescriptModelServiceMock = jest.mocked(TypescriptGeneratorModelService);
const storageMock = jest.mocked(Storage);

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
		storageMock.mockClear();
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
			undefined,
			{ 'x-custom': true },
		);

		const modelStorage = new Storage<ObjectModelDef, ITsModel[]>();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			modelStorage,
			registry,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			modelStorage,
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
			method: 'GET',
			urlPattern: '/api',
			request: {
				dependencies: [],
				bodyTypeName: undefined,
				multipart: undefined,
				pathParametersType: undefined,
				queryParametersMapping: undefined,
				queryParametersType: undefined,
			},
			response: {
				dependencies: [],
				typeName: 'void',
			},
			extensions: { 'x-custom': true },
			deprecated: false,
			summaries: undefined,
			descriptions: undefined,
		};

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile.templateData!.paths).toStrictEqual([path]);

		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile.templateData!.parametrizeUrlPattern).toBeTruthy();
		expect(resultFile.templateData!.toJSDocConfig).toBeTruthy();
		expect(resultFile.templateData!.jsdoc).toBeTruthy();
	});

	it('should generate file (with parameters)', () => {
		generateEntityNameMock.mockReturnValueOnce('MyApi');
		toKebabCaseMock.mockReturnValueOnce('my-api');
		generateMethodNameMock.mockReturnValueOnce('apiGet');
		generatePropertyNameMock.mockReturnValueOnce('queryParam1');

		const pathParameters = new PathParametersObjectModelDef(
			'/api get Request Path Parameters',
			[new Property('PathParam1', new SimpleModelDef('string'), true, true)],
		);

		const queryParameters = new QueryParametersObjectModelDef(
			'/api get Request Query Parameters',
			[new Property('QueryParam1', new SimpleModelDef('integer', 'int32'), true, true)],
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
			undefined,
			{ 'x-custom': true },
		);

		const modelStorage = new Storage<ObjectModelDef, ITsModel[]>();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			modelStorage,
			registry,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			modelStorage,
			registry,
			testingTypescriptGeneratorConfig,
		);

		const modelServiceMock = jest.mocked(ngTypescriptModelServiceMock.mock.instances[0]);

		modelServiceMock?.resolvePropertyType.mockReturnValueOnce(
			'/api get Request Query Parameters',
		);

		const modelStorageMock = jest.mocked(storageMock.mock.instances[0]);

		const pathParametersModel: ITsModel = {
			name: '/api get Request Path Parameters',
			deprecated: false,
			properties: [
				{
					name: 'pathParam1',
					type: 'string',
					required: true,
					nullable: true,
					deprecated: false,
					dependencies: [],
					extensions: {},
				},
			],
		};

		const queryParametersModel: ITsModel = {
			name: '/api get Request Query Parameters',
			deprecated: false,
			properties: [
				{
					name: 'QueryParam1',
					type: 'integer',
					required: true,
					nullable: true,
					deprecated: false,
					dependencies: [],
					extensions: {},
				},
			],
		};

		modelStorageMock?.get.mockReturnValueOnce([pathParametersModel]);
		modelStorageMock?.get.mockReturnValueOnce([queryParametersModel]);

		const result = service.generate([pathDef]);

		expect(result.length).toStrictEqual(1);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('services/my-api.service');
		expect(resultFile?.template).toStrictEqual('service');

		const path: ITsPath = {
			name: 'apiGet',
			method: 'GET',
			urlPattern: '/api',
			request: {
				multipart: undefined,
				dependencies: ['/api get Request Query Parameters'],
				bodyTypeName: undefined,
				pathParametersType: pathParametersModel,
				queryParametersMapping: [
					{
						originalName: 'QueryParam1',
						objectPath: ['queryParam1'],
					},
				],
				queryParametersType: queryParametersModel,
			},
			response: {
				dependencies: [],
				typeName: 'void',
			},
			extensions: { 'x-custom': true },
			deprecated: false,
			summaries: undefined,
			descriptions: undefined,
		};

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile?.templateData!.paths).toStrictEqual([path]);

		expect(resultFile?.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile?.templateData!.parametrizeUrlPattern).toBeTruthy();
	});

	it('should generate file (with body and response)', () => {
		generateEntityNameMock.mockReturnValueOnce('MyApi');
		toKebabCaseMock.mockReturnValueOnce('my-api');
		generateMethodNameMock.mockReturnValueOnce('apiPost');

		const requestBodyDef = new SimpleModelDef('string');
		const requestBody = new PathRequestBody('application/json', requestBodyDef);

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
			undefined,
			{ 'x-custom': true },
		);

		const modelStorage = new Storage<ObjectModelDef, ITsModel[]>();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			modelStorage,
			registry,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			modelStorage,
			registry,
			testingTypescriptGeneratorConfig,
		);

		const modelServiceMock = jest.mocked(ngTypescriptModelServiceMock.mock.instances[0]);

		modelServiceMock?.resolvePropertyDef.mockReturnValueOnce(requestBodyDef);
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
			method: 'POST',
			urlPattern: '/api',
			request: {
				dependencies: [],
				bodyTypeName: 'string',
				multipart: false,
				pathParametersType: undefined,
				queryParametersMapping: undefined,
				queryParametersType: undefined,
			},
			response: {
				dependencies: [],
				typeName: 'boolean',
				description: undefined,
			},
			extensions: { 'x-custom': true },
			deprecated: false,
			summaries: undefined,
			descriptions: undefined,
		};

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile.templateData!.paths).toStrictEqual([path]);

		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile.templateData!.parametrizeUrlPattern).toBeTruthy();
	});
});
