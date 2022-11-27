import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { Hooks } from '@core/hooks/hooks';
import { toCamelCase, toPascalCase } from '@core/utils';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';

jest.mock('@core/utils');
jest.mock('./typescript-generator.model');

const toCamelCaseMock = jest.mocked(toCamelCase);
const toPascalCaseMock = jest.mocked(toPascalCase);

const hooksGetOrDefaultSpy = jest.spyOn(Hooks, 'getOrDefault');

describe('typescript-generator-naming', () => {
	// TODO add tests

	beforeAll(() => {
		hooksGetOrDefaultSpy.mockImplementation((_, fn) => fn);

		toCamelCaseMock.mockImplementation((...args) => args.join(''));
		toPascalCaseMock.mockImplementation((...args) => args.join(''));
	});

	beforeEach(() => {
		toCamelCaseMock.mockClear();
		toPascalCaseMock.mockClear();
	});

	afterAll(() => {
		hooksGetOrDefaultSpy.mockRestore();
	});

	it('should generate unique name', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModelDef('Test');

		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual('Test');
		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual('Test1');
	});

	it('should generate correct name by origin', () => {
		const service = new TypescriptGeneratorNamingService();

		const entity = new ObjectModelDef('Test');

		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual('Test');

		entity.origin = PATH_PARAMETERS_OBJECT_ORIGIN;
		entity.isAutoName = true;

		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual(
			'TestPathParameters',
		);

		entity.origin = QUERY_PARAMETERS_OBJECT_ORIGIN;

		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual(
			'TestQueryParameters',
		);

		entity.origin = BODY_OBJECT_ORIGIN;

		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual('TestBody');

		entity.origin = RESPONSE_OBJECT_ORIGIN;

		expect(service.generateUniqueReferenceEntityName(entity)).toStrictEqual('TestResponse');
	});
});
