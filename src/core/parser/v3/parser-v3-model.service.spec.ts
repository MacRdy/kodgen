import { ArrayModelDef } from '@core/entities/schema-entities/array-model-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/model-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { SchemaEntity } from '@core/entities/shared.model';
import { OpenAPIV3 } from 'openapi-types';
import { ParserRepositoryService } from '../parser-repository.service';
import { ParserV3ModelService } from './parser-v3-model.service';

const parseSchemaEntity = jest.fn<SchemaEntity, []>();

describe('parser-v3-model', () => {
	beforeEach(() => {
		parseSchemaEntity.mockClear();
	});

	it('should create a simple model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3ModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {
			type: 'integer',
			format: 'int64',
		};

		(schema as Record<string, unknown>)['x-custom'] = true;

		const addEntitySpy = jest
			.spyOn(ParserRepositoryService.prototype, 'addEntity')
			.mockReturnValue();

		const result = service.parse(schema);

		expect(addEntitySpy).not.toHaveBeenCalled();
		expect(parseSchemaEntity).not.toHaveBeenCalled();

		const expected = new SimpleModelDef('integer', 'int64', { 'x-custom': true });

		expect(result).toStrictEqual(expected);
	});

	it('should create an array model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3ModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {
			type: 'array',
			items: {
				type: 'number',
				format: 'float',
			},
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('number', 'float'));

		const addEntitySpy = jest
			.spyOn(ParserRepositoryService.prototype, 'addEntity')
			.mockReturnValue();

		const result = service.parse(schema, 'Array');

		expect(addEntitySpy).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalled();

		const expected = new ArrayModelDef(new SimpleModelDef('number', 'float'), {
			'x-custom': true,
		});

		expect(result).toStrictEqual(expected);
	});

	it('should create an object model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3ModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {
			type: 'object',
			required: ['prop1'],
			properties: {
				prop1: { type: 'string', nullable: true },
				prop2: { type: 'integer', format: 'int32' },
			},
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('string'));
		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('integer', 'int32'));

		const addEntitySpy = jest
			.spyOn(ParserRepositoryService.prototype, 'addEntity')
			.mockReturnValue();

		const result = service.parse(schema, 'Object');

		expect(addEntitySpy).toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const expectedProperties = [
			new Property('prop1', new SimpleModelDef('string'), true, true),
			new Property('prop2', new SimpleModelDef('integer', 'int32'), false, false),
		];

		const expected = new ObjectModelDef('Object', expectedProperties, { 'x-custom': true });

		expect(result).toStrictEqual(expected);
	});

	it('should throw an error when unknown type', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3ModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {};

		expect(() => service.parse(schema)).toThrow('Unsupported model schema type.');
	});

	it('should throw an error when no name provided', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new ParserV3ModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = { type: 'object' };

		expect(() => service.parse(schema)).toThrow('Object name not defined.');
	});
});
