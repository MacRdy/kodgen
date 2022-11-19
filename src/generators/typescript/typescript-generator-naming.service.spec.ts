import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';
import { generateEntityName } from './typescript-generator.model';

jest.mock('./typescript-generator.model');

const generateEntityNameMock = jest.mocked(generateEntityName);

describe('typescript-generator-naming', () => {
	beforeAll(() => {
		generateEntityNameMock.mockImplementation(x => x);
	});

	beforeEach(() => {
		generateEntityNameMock.mockClear();
	});

	it('should generate unique name', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModelDef('Test');

		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test');
		expect(service.generateReferenceEntityName(entity)).toStrictEqual('Test1');
	});

	it('should generate correct name by origin', () => {
		const service = new TypescriptGeneratorNamingService();

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
