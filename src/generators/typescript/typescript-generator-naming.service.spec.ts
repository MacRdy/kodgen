import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
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

		const entity = new ObjectModelDef('Test');

		const storageMock = jest.mocked(storage);
		storageMock.getSummary.mockReturnValueOnce([]);
		storageMock.getSummary.mockReturnValueOnce([{ name: 'Test' }]);
		storageMock.getSummary.mockReturnValueOnce([{ name: 'Test' }]);

		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test');
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test1');
	});
});
