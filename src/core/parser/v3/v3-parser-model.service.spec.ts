import { ArrayModelDef } from '@core/entities/schema-entities/array-model-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { SchemaEntity } from '@core/entities/shared.model';
import { OpenAPIV3 } from 'openapi-types';
import { ParserRepositoryService } from '../parser-repository.service';
import { TrivialError } from '../parser.model';
import { V3ParserModelService } from './v3-parser-model.service';

jest.mock('../parser-repository.service');

const repositoryMock = jest.mocked(ParserRepositoryService);

const parseSchemaEntity = jest.fn<SchemaEntity, []>();

describe('parser-model', () => {
	beforeEach(() => {
		repositoryMock.mockClear();
		parseSchemaEntity.mockClear();
	});

	it('should create a simple model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {
			type: 'integer',
			format: 'int64',
		};

		(schema as Record<string, unknown>)['x-custom'] = true;

		const result = service.parse(schema);

		expect(repositoryMock.mock.instances[0]?.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).not.toHaveBeenCalled();

		const expected = new SimpleModelDef('integer', { format: 'int64' });

		expect(result).toStrictEqual(expected);
	});

	it('should create an array model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {
			type: 'array',
			items: {
				type: 'number',
				format: 'float',
			},
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(
			() => new SimpleModelDef('number', { format: 'float' }),
		);

		const result = service.parse(schema, 'Array');

		expect(repositoryMock.mock.instances[0]?.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalled();

		const expected = new ArrayModelDef(new SimpleModelDef('number', { format: 'float' }));

		expect(result).toStrictEqual(expected);
	});

	it('should create an object model', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserModelService(repository, parseSchemaEntity);

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
		parseSchemaEntity.mockImplementationOnce(
			() => new SimpleModelDef('integer', { format: 'int32' }),
		);

		const result = service.parse(schema, 'Object');

		expect(repositoryMock.mock.instances[0]?.addEntity).toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const properties = [
			new Property('prop1', new SimpleModelDef('string'), { required: true, nullable: true }),
			new Property('prop2', new SimpleModelDef('integer', { format: 'int32' })),
		];

		const expected = new ObjectModelDef('Object', {
			properties,
			extensions: { 'x-custom': true },
		});

		expect(result).toStrictEqual(expected);
	});

	it('should throw an error when unknown type', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = {};

		expect(() => service.parse(schema)).toThrow(TrivialError);
		expect(() => service.parse(schema)).toThrow('Unsupported model schema type (empty type).');
	});

	it('should throw an error when no name provided', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserModelService(repository, parseSchemaEntity);

		const schema: OpenAPIV3.SchemaObject = { type: 'object' };

		expect(() => service.parse(schema)).toThrow('Object name not defined.');
	});
});
