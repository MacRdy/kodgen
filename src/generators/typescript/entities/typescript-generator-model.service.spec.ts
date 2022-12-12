import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { QUERY_PARAMETERS_OBJECT_ORIGIN } from '../../../core/entities/schema-entities/path-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { Hooks } from '../../../core/hooks/hooks';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { mergeParts, toKebabCase } from '../../../core/utils';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import { ITsGeneratorConfig, ITsModel } from '../typescript-generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';

jest.mock('../../../core/import-registry/import-registry.service');
jest.mock('../../../core/hooks/hooks');
jest.mock('../../../core/utils');
jest.mock('../typescript-generator.model');
jest.mock('../typescript-generator-naming.service');

const namingServiceGlobalMock = jest.mocked(TypescriptGeneratorNamingService);
const toKebabCaseMock = jest.mocked(toKebabCase);
const mergePartsMock = jest.mocked(mergeParts);

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

describe('typescript-generator-model', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		namingServiceGlobalMock.mockClear();
		toKebabCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file from model def', () => {
		const properties: Property[] = [
			new Property('prop1', new SimpleModelDef('integer', { format: 'int32' }), {
				required: true,
				nullable: true,
			}),
			new Property('prop2', new SimpleModelDef('string')),
		];

		const modelDef = new ObjectModelDef('modelName', {
			properties,
			additionalProperties: new SimpleModelDef('integer', { format: 'int32' }),
			extensions: {
				'x-custom': true,
			},
		});

		toKebabCaseMock.mockReturnValueOnce('model-name');

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		jest.mocked(namingService).generateUniqueReferenceEntityName.mockReturnValueOnce(
			'ModelName',
		);

		const result = service.generate([modelDef]);

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(1);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('models/model-name');
		expect(resultFile?.template).toStrictEqual('model');

		const expectedModel: ITsModel = {
			name: 'ModelName',
			dependencies: [],
			additionPropertiesTypeName: 'number',
			properties: [
				{
					name: 'prop1',
					type: 'number',
					required: true,
					nullable: true,
					deprecated: false,
					dependencies: [],
					extensions: {},
					description: undefined,
				},
				{
					name: 'prop2',
					type: 'string',
					required: false,
					nullable: false,
					deprecated: false,
					dependencies: [],
					extensions: {},
					description: undefined,
				},
			],
			deprecated: false,
		};

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData?.models).toStrictEqual([expectedModel]);
		expect(resultFile?.templateData?.extensions).toStrictEqual({ 'x-custom': true });

		expect(resultFile?.templateData?.isValidName).toBeTruthy();
		expect(resultFile?.templateData?.getImportEntries).toBeTruthy();
	});

	// TODO add tests additionalProperties with dependencies

	it('should generate file with simplified model', () => {
		const properties: Property[] = [
			new Property(
				'Filter.Current.Date.From',
				new SimpleModelDef('string', { format: 'date-time' }),
				{ required: true, nullable: true },
			),
			new Property(
				'Filter.Current.Date.To',
				new SimpleModelDef('string', { format: 'date-time' }),
			),
			new Property(
				'Filter.Current.ClientId',
				new SimpleModelDef('string', { format: 'int32' }),
				{ required: true, nullable: true },
			),
			new Property('Id', new SimpleModelDef('string')),
		];

		const modelDef = new ObjectModelDef('queryParametersModelName', {
			properties,
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const storage = new TypescriptGeneratorStorageService();
		const namingService = new TypescriptGeneratorNamingService();
		const registry = new ImportRegistryService();

		const namingServiceMock = jest.mocked(namingService);

		const service = new TypescriptGeneratorModelService(
			storage,
			registry,
			namingService,
			testingTypescriptGeneratorConfig,
		);

		toKebabCaseMock.mockReturnValueOnce('query-parameters-model-name');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter Current');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter Current Date');

		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('filter');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('current');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('date');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('from');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('to');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('clientId');
		namingServiceMock.generateUniquePropertyName.mockReturnValueOnce('id');

		namingServiceMock.generateUniqueReferenceEntityName.mockReturnValueOnce(
			'QueryParametersModelName',
		);
		namingServiceMock.generateUniqueReferenceEntityName.mockReturnValueOnce(
			'QueryParametersModelNameFilter',
		);
		namingServiceMock.generateUniqueReferenceEntityName.mockReturnValueOnce(
			'QueryParametersModelNameFilterCurrent',
		);
		namingServiceMock.generateUniqueReferenceEntityName.mockReturnValueOnce(
			'QueryParametersModelNameFilterCurrentDate',
		);

		const result = service.generate([modelDef]);

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(4);

		const resultFile = result[0];

		expect(resultFile?.path).toStrictEqual('models/query-parameters-model-name');
		expect(resultFile?.template).toStrictEqual('model');

		const expectedModels: ITsModel[] = [
			{
				name: 'QueryParametersModelName',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'filter',
						type: 'QueryParametersModelNameFilter',
						required: false,
						nullable: false,
						deprecated: false,
						dependencies: ['QueryParametersModelNameFilter'],
						extensions: {},
						description: undefined,
					},
					{
						name: 'id',
						type: 'string',
						required: false,
						nullable: false,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
			{
				name: 'QueryParametersModelNameFilter',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'current',
						type: 'QueryParametersModelNameFilterCurrent',
						required: false,
						nullable: false,
						deprecated: false,
						dependencies: ['QueryParametersModelNameFilterCurrent'],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
			{
				name: 'QueryParametersModelNameFilterCurrent',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'date',
						type: 'QueryParametersModelNameFilterCurrentDate',
						required: false,
						nullable: false,
						deprecated: false,
						dependencies: ['QueryParametersModelNameFilterCurrentDate'],
						extensions: {},
						description: undefined,
					},
					{
						name: 'clientId',
						type: 'string',
						required: true,
						nullable: true,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
			{
				name: 'QueryParametersModelNameFilterCurrentDate',
				dependencies: [],
				additionPropertiesTypeName: undefined,
				properties: [
					{
						name: 'from',
						type: 'string',
						required: true,
						nullable: true,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
					{
						name: 'to',
						type: 'string',
						required: false,
						nullable: false,
						deprecated: false,
						dependencies: [],
						extensions: {},
						description: undefined,
					},
				],
				deprecated: false,
			},
		];

		expect(resultFile?.templateData).toBeTruthy();

		expect(resultFile?.templateData!.models).toStrictEqual(expectedModels);
		expect(resultFile?.templateData!.extensions).toStrictEqual({});

		expect(resultFile?.templateData!.isValidName).toBeTruthy();
		expect(resultFile?.templateData!.getImportEntries).toBeTruthy();
		expect(resultFile?.templateData!.jsdoc).toBeTruthy();
	});
});
