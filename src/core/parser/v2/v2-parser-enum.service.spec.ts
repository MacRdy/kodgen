import { OpenAPIV2 } from 'openapi-types';
import { EnumDef, EnumEntryDef } from '../../entities/schema-entities/enum-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { V2ParserEnumService } from './v2-parser-enum.service';

jest.mock('../parser-repository.service');

const repositoryMock = jest.mocked(ParserRepositoryService);

describe('v2-parser-enum', () => {
	beforeEach(() => {
		repositoryMock.mockClear();
	});

	it('should detect supported schema', () => {
		const repository = new ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>();
		const service = new V2ParserEnumService(repository);

		const objectSchema: OpenAPIV2.SchemaObject = { type: 'object' };
		expect(service.isSupported(objectSchema)).toStrictEqual(false);

		const enumSchema: OpenAPIV2.SchemaObject = { enum: [] };
		expect(service.isSupported(enumSchema)).toStrictEqual(true);
	});

	it('should create default model', () => {
		const repository = new ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>();
		const service = new V2ParserEnumService(repository);

		const enumObject: OpenAPIV2.SchemaObject = {
			enum: [1, 2, 3],
			type: 'integer',
			format: 'int32',
		};

		(enumObject as Record<string, unknown>)['x-custom'] = true;

		const result = service.parse(enumObject, { name: 'name' });

		expect(repositoryMock.mock.instances[0]?.addEntity).toHaveBeenCalled();

		const expectedEnumEntries = [
			new EnumEntryDef('_1', 1),
			new EnumEntryDef('_2', 2),
			new EnumEntryDef('_3', 3),
		];

		const expectedEnum = new EnumDef('name', 'integer', expectedEnumEntries, {
			format: 'int32',
			extensions: {
				'x-custom': true,
				custom: true,
			},
		});

		expect(result).toStrictEqual(expectedEnum);
	});

	it('should use the correct entry names', () => {
		const repository = new ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>();
		const service = new V2ParserEnumService(repository);

		const enumObject: OpenAPIV2.SchemaObject = {
			enum: [1, 2, 3],
			type: 'integer',
		};

		(enumObject as Record<string, unknown>)['x-enumNames'] = ['High', 'Medium', 'Low'];

		const result = service.parse(enumObject, { name: 'name' });

		const expectedEnumEntries = [
			new EnumEntryDef('High', 1),
			new EnumEntryDef('Medium', 2),
			new EnumEntryDef('Low', 3),
		];

		const expectedEnum = new EnumDef('name', 'integer', expectedEnumEntries, {
			extensions: {
				'x-enumNames': ['High', 'Medium', 'Low'],
				enumNames: ['High', 'Medium', 'Low'],
			},
		});

		expect(result).toStrictEqual(expectedEnum);
	});
});
