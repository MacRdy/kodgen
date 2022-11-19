import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { generateEntityName } from './typescript-generator.model';

jest.mock('./typescript-generator-storage.service');
jest.mock('./typescript-generator.model');

const storageGlobalMock = jest.mocked(TypescriptGeneratorStorageService);
const generateEntityNameMock = jest.mocked(generateEntityName);

describe('typescript-generator-naming', () => {
	beforeAll(() => {
		generateEntityNameMock.mockImplementation(x => x);
	});

	beforeEach(() => {
		storageGlobalMock.mockClear();
		generateEntityNameMock.mockClear();
	});

	it('should generate unique name', () => {
		const storage = new TypescriptGeneratorStorageService();
		const service = new TypescriptGeneratorNamingService(storage);

		const storageMock = jest.mocked(storage);
		storageMock.getSummary.mockReturnValueOnce([]);
		storageMock.getSummary.mockReturnValueOnce([{ name: 'Test' }]);
		storageMock.getSummary.mockReturnValueOnce([{ name: 'Test' }]);

		const entity = new ObjectModelDef('Test');

		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test');
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test1');
	});

	it('should generate correct name by origin', () => {
		const storage = new TypescriptGeneratorStorageService();
		const service = new TypescriptGeneratorNamingService(storage);

		const storageMock = jest.mocked(storage);
		storageMock.getSummary.mockReturnValue([]);

		const entity = new ObjectModelDef('Test');

		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test');

		entity.setOrigin(PATH_PARAMETERS_OBJECT_ORIGIN, true);
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test Path Parameters');

		entity.setOrigin(QUERY_PARAMETERS_OBJECT_ORIGIN, true);
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test Query Parameters');

		entity.setOrigin(BODY_OBJECT_ORIGIN, true);
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test Body');

		entity.setOrigin(RESPONSE_OBJECT_ORIGIN, true);
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test Response');
	});
});
