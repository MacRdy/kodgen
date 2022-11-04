import { EnumDef, EnumEntryDef } from '@core/entities/schema-entities/enum-def.model';
import { SchemaEntity } from '@core/entities/shared.model';
import { OpenAPIV3 } from 'openapi-types';
import { ParserRepositoryService } from '../parser-repository.service';
import { ParserV3EnumService } from './parser-v3-enum.service';

describe('parser-v3-enum', () => {
	it('should detect supported schema', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3EnumService(repository);

		const objectSchema: OpenAPIV3.SchemaObject = { type: 'object' };
		expect(service.isSupported(objectSchema)).toStrictEqual(false);

		const enumSchema: OpenAPIV3.SchemaObject = { enum: [] };
		expect(service.isSupported(enumSchema)).toStrictEqual(true);
	});

	it('should create the correct model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3EnumService(repository);

		const enumObject: OpenAPIV3.SchemaObject = {
			enum: [1, 2, 3],
			type: 'integer',
			format: 'int32',
		};

		(enumObject as Record<string, unknown>)['x-custom'] = true;

		const addEntitySpy = jest
			.spyOn(ParserRepositoryService.prototype, 'addEntity')
			.mockReturnValue();

		const result = service.parse('name', enumObject);

		expect(addEntitySpy).toHaveBeenCalled();

		const expectedEnumEntries = [
			new EnumEntryDef('_1', 1),
			new EnumEntryDef('_2', 2),
			new EnumEntryDef('_3', 3),
		];

		const expectedEnum = new EnumDef('name', 'integer', expectedEnumEntries, 'int32', {
			'x-custom': true,
		});

		expect(result).toStrictEqual(expectedEnum);
	});

	it('should use the correct entry names', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3EnumService(repository);

		const enumObject: OpenAPIV3.SchemaObject = {
			enum: [1, 2, 3],
			type: 'integer',
		};

		(enumObject as Record<string, unknown>)['x-enumNames'] = ['High', 'Medium', 'Low'];

		const result = service.parse('name', enumObject);

		const expectedEnumEntries = [
			new EnumEntryDef('High', 1),
			new EnumEntryDef('Medium', 2),
			new EnumEntryDef('Low', 3),
		];

		const expectedEnum = new EnumDef('name', 'integer', expectedEnumEntries, undefined, {
			'x-enumNames': ['High', 'Medium', 'Low'],
		});

		expect(result).toStrictEqual(expectedEnum);
	});
});
