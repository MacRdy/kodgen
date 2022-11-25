import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import {
	PathDef,
	PathRequestBody,
	PathResponse,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { Hooks } from '@core/hooks/hooks';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGeneratorConfig,
	ITsModel,
	ITsPath,
	ITsPropertyMapping,
} from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/hooks/hooks');
jest.mock('@core/utils');
jest.mock('./typescript-generator-model.service');
jest.mock('../typescript-generator-storage.service');
jest.mock('../typescript-generator-naming.service');
jest.mock('../typescript-generator.model');

const toKebabCaseMock = jest.mocked(toKebabCase);
const modelServiceMock = jest.mocked(TypescriptGeneratorModelService);
const storageServiceMock = jest.mocked(TypescriptGeneratorStorageService);
const namingServiceGlobalMock = jest.mocked(TypescriptGeneratorNamingService);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

const testingTypescriptGeneratorConfig: ITsGeneratorConfig = {
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

describe('typescript-generator-path', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		toKebabCaseMock.mockClear();

		modelServiceMock.mockClear();
		storageServiceMock.mockClear();
		namingServiceGlobalMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file (simple)', () => {
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const pathDef = new PathDef('/api', 'GET', {
			tags: ['myApi'],
			extensions: { 'x-custom': true },
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const namingServiceMock = jest.mocked(namingService);
		namingServiceMock.generateUniquePathEntityName.mockReturnValueOnce('MyApi');
		namingServiceMock.generateUniquePathUrlName.mockReturnValueOnce('apiGet');

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

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData!.name).toStrictEqual('MyApi');
		expect(resultFile?.templateData!.paths).toStrictEqual([path]);

		expect(resultFile?.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile?.templateData!.parametrizeUrlPattern).toBeTruthy();
		expect(resultFile?.templateData!.toJSDocConfig).toBeTruthy();
		expect(resultFile?.templateData!.jsdoc).toBeTruthy();
	});

	it('should generate file (with parameters)', () => {
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const pathParameters = new ObjectModelDef('/api get Request Path Parameters', {
			properties: [
				new Property('PathParam1', new SimpleModelDef('string'), {
					required: true,
					nullable: true,
				}),
			],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryParameters = new ObjectModelDef('/api get Request Query Parameters', {
			properties: [
				new Property('QueryParam1', new SimpleModelDef('integer', { format: 'int32' }), {
					required: true,
					nullable: true,
				}),
			],
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const pathDef = new PathDef('/api', 'GET', {
			requestPathParameters: pathParameters,
			requestQueryParameters: queryParameters,
			tags: ['myApi'],
			extensions: { 'x-custom': true },
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const namingServiceMock = jest.mocked(namingService);
		namingServiceMock.generateUniquePathEntityName.mockReturnValueOnce('MyApi');
		namingServiceMock.generateUniquePathUrlName.mockReturnValueOnce('apiGet');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('queryParam1');

		const modelServiceInstanceMock = jest.mocked(modelService);

		modelServiceInstanceMock?.resolvePropertyType.mockReturnValueOnce(
			'/api get Request Query Parameters',
		);

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

		const storageServiceInstanceMock = jest.mocked(storage);

		storageServiceInstanceMock?.get.mockReturnValueOnce({
			generatedModel: pathParametersModel,
		});

		const queryParametersMapping: ITsPropertyMapping[] = [
			{
				objectPath: ['queryParam1'],
				originalName: 'QueryParam1',
			},
		];

		storageServiceInstanceMock?.get.mockReturnValueOnce({
			generatedModel: queryParametersModel,
			mapping: queryParametersMapping,
		});

		storageServiceInstanceMock?.get.mockReturnValueOnce({
			generatedModel: queryParametersModel,
			mapping: queryParametersMapping,
		});

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
		toKebabCaseMock.mockReturnValueOnce('my-api');

		const requestBodyDef = new SimpleModelDef('string');
		const requestBody = new PathRequestBody('application/json', requestBodyDef);

		const responseDef = new SimpleModelDef('boolean');
		const response = new PathResponse('200', 'application/json', responseDef);

		const pathDef = new PathDef('/api', 'POST', {
			requestBody: [requestBody],
			responses: [response],
			tags: ['myApi'],
			extensions: { 'x-custom': true },
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const modelService = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const service = new TypescriptGeneratorPathService(
			modelService,
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		const namingServiceMock = jest.mocked(namingService);
		namingServiceMock.generateUniquePathEntityName.mockReturnValueOnce('MyApi');
		namingServiceMock.generateUniquePathUrlName.mockReturnValueOnce('apiPost');

		const modelServiceInstanceMock = jest.mocked(modelService);

		modelServiceInstanceMock?.resolvePropertyDef.mockReturnValueOnce(requestBodyDef);
		modelServiceInstanceMock?.resolvePropertyType.mockReturnValueOnce('string');

		modelServiceInstanceMock?.resolvePropertyDef.mockReturnValueOnce(responseDef);
		modelServiceInstanceMock?.resolvePropertyType.mockReturnValueOnce('boolean');

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
