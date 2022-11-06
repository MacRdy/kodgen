import { ObjectModelDef } from '@core/entities/schema-entities/model-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { Hooks } from '@core/hooks/hooks';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import { IGeneratorFile } from '@generators/generator.model';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import { generateEntityName, generatePropertyName, INgtsModel } from './ng-typescript.model';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/hooks/hooks');
jest.mock('@core/utils');
jest.mock('./ng-typescript.model');

const generateEntityNameMock = jest.mocked(generateEntityName);
const generatePropertyNameMock = jest.mocked(generatePropertyName);
const toKebabCaseMock = jest.mocked(toKebabCase);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('ng-typescript-model', () => {
	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);
	});

	beforeEach(() => {
		generateEntityNameMock.mockClear();
		generatePropertyNameMock.mockClear();
		toKebabCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate file from model def', () => {
		generateEntityNameMock.mockReturnValueOnce('ModelName');
		generatePropertyNameMock.mockReturnValueOnce('prop1');
		generatePropertyNameMock.mockReturnValueOnce('prop2');
		toKebabCaseMock.mockReturnValueOnce('model-name');

		const properties: Property[] = [
			new Property('Prop1', new SimpleModelDef('integer', 'int32'), true, true),
			new Property('Prop2', new SimpleModelDef('string'), false, false),
		];

		const modelDef = new ObjectModelDef('modelName', properties, { 'x-custom': true });

		const registry = new ImportRegistryService();
		const service = new NgTypescriptModelService(registry);

		const result = service.generate([modelDef]);

		expect(result.length).toStrictEqual(1);

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
});
