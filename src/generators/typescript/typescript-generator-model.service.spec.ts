import { ObjectModelDef } from '@core/entities/schema-entities/model-def.model';
import { QueryParametersObjectModelDef } from '@core/entities/schema-entities/path-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { Hooks } from '@core/hooks/hooks';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { mergeParts, toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { generateEntityName, generatePropertyName, INgtsModel } from './typescript-generator.model';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/hooks/hooks');
jest.mock('@core/utils');
jest.mock('./ng-typescript.model');

const generateEntityNameMock = jest.mocked(generateEntityName);
const generatePropertyNameMock = jest.mocked(generatePropertyName);
const toKebabCaseMock = jest.mocked(toKebabCase);
const mergePartsMock = jest.mocked(mergeParts);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('typescript-generator-model', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		generateEntityNameMock.mockClear();
		toKebabCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file from model def', () => {
		const properties: Property[] = [
			new Property('prop1', new SimpleModelDef('integer', 'int32'), true, true),
			new Property('prop2', new SimpleModelDef('string'), false, false),
		];

		const modelDef = new ObjectModelDef('modelName', properties, { 'x-custom': true });

		toKebabCaseMock.mockReturnValueOnce('model-name');
		generateEntityNameMock.mockReturnValueOnce('ModelName');

		const registry = new ImportRegistryService();
		const service = new TypescriptGeneratorModelService(registry);

		const result = service.generate([modelDef]);

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(1);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('models/model-name');
		expect(resultFile.template).toStrictEqual('model');

		const expectedModel: INgtsModel = {
			name: 'ModelName',
			properties: [
				{
					name: 'prop1',
					type: 'number',
					required: true,
					nullable: true,
					dependencies: [],
				},
				{
					name: 'prop2',
					type: 'string',
					required: false,
					nullable: false,
					dependencies: [],
				},
			],
		};

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.models).toStrictEqual([expectedModel]);
		expect(resultFile.templateData!.extensions).toStrictEqual({ 'x-custom': true });

		expect(resultFile.templateData!.isValidName).toBeTruthy();
		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
	});

	it('should generate file with simplified model', () => {
		const properties: Property[] = [
			new Property(
				'Filter.Current.Date.From',
				new SimpleModelDef('string', 'date-time'),
				true,
				true,
			),
			new Property(
				'Filter.Current.Date.To',
				new SimpleModelDef('string', 'date-time'),
				false,
				false,
			),
			new Property(
				'Filter.Current.ClientId',
				new SimpleModelDef('string', 'int32'),
				true,
				true,
			),
			new Property('Id', new SimpleModelDef('string'), false, false),
		];

		const modelDef = new QueryParametersObjectModelDef('queryParametersModelName', properties);

		toKebabCaseMock.mockReturnValueOnce('query-parameters-model-name');
		generatePropertyNameMock.mockReturnValueOnce('current');
		generatePropertyNameMock.mockReturnValueOnce('current');
		generatePropertyNameMock.mockReturnValueOnce('current');
		generatePropertyNameMock.mockReturnValueOnce('id');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filter');
		generatePropertyNameMock.mockReturnValueOnce('date');
		generatePropertyNameMock.mockReturnValueOnce('date');
		generatePropertyNameMock.mockReturnValueOnce('clientId');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filer current');
		generatePropertyNameMock.mockReturnValueOnce('from');
		generatePropertyNameMock.mockReturnValueOnce('to');
		generatePropertyNameMock.mockReturnValueOnce('clientId');
		mergePartsMock.mockReturnValueOnce('queryParametersModelName Filer current date');
		generatePropertyNameMock.mockReturnValueOnce('from');
		generatePropertyNameMock.mockReturnValueOnce('to');
		generatePropertyNameMock.mockReturnValueOnce('date');
		generatePropertyNameMock.mockReturnValueOnce('current');
		generatePropertyNameMock.mockReturnValueOnce('filter');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelName');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilter');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilter');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilter');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilterCurrent');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilterCurrent');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilterCurrent');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilterCurrentDate');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilterCurrentDate');
		generateEntityNameMock.mockReturnValueOnce('QueryParametersModelNameFilterCurrentDate');

		const registry = new ImportRegistryService();
		const service = new TypescriptGeneratorModelService(registry);

		const result = service.generate([modelDef]);

		expect(result.length).toStrictEqual(1);
		expect(registry.createLink).toHaveBeenCalledTimes(4);

		const resultFile = result[0] as IGeneratorFile;

		expect(resultFile.path).toStrictEqual('models/query-parameters-model-name');
		expect(resultFile.template).toStrictEqual('model');

		const expectedModels: INgtsModel[] = [
			{
				name: 'QueryParametersModelName',
				properties: [
					{
						name: 'id',
						type: 'string',
						required: false,
						nullable: false,
						dependencies: [],
					},
					{
						name: 'filter',
						type: 'QueryParametersModelNameFilter',
						required: false,
						nullable: false,
						dependencies: ['QueryParametersModelNameFilter'],
					},
				],
			},
			{
				name: 'QueryParametersModelNameFilter',
				properties: [
					{
						name: 'current',
						type: 'QueryParametersModelNameFilterCurrent',
						required: false,
						nullable: false,
						dependencies: ['QueryParametersModelNameFilterCurrent'],
					},
				],
			},
			{
				name: 'QueryParametersModelNameFilterCurrent',
				properties: [
					{
						name: 'clientId',
						type: 'string',
						required: true,
						nullable: true,
						dependencies: [],
					},
					{
						name: 'date',
						type: 'QueryParametersModelNameFilterCurrentDate',
						required: false,
						nullable: false,
						dependencies: ['QueryParametersModelNameFilterCurrentDate'],
					},
				],
			},
			{
				name: 'QueryParametersModelNameFilterCurrentDate',
				properties: [
					{
						name: 'from',
						type: 'string',
						required: true,
						nullable: true,
						dependencies: [],
					},
					{
						name: 'to',
						type: 'string',
						required: false,
						nullable: false,
						dependencies: [],
					},
				],
			},
		];

		expect(resultFile.templateData).toBeTruthy();

		expect(resultFile.templateData!.models).toStrictEqual(expectedModels);
		expect(resultFile.templateData!.extensions).not.toBeDefined();

		expect(resultFile.templateData!.isValidName).toBeTruthy();
		expect(resultFile.templateData!.getImportEntries).toBeTruthy();
	});
});
