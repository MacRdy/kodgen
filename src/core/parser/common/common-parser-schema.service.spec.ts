import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { Model } from '../../../core/entities/shared.model';
import { ArrayModel } from '../../entities/model/array-model.model';
import { ConstantModel } from '../../entities/model/constant-model.model';
import { EnumEntry, EnumModel } from '../../entities/model/enum-model.model';
import { ExtendedModel } from '../../entities/model/extended-model.model';
import { NullModel } from '../../entities/model/null-model.model';
import { ObjectModel } from '../../entities/model/object-model.model';
import { Property } from '../../entities/model/property.model';
import { SimpleModel } from '../../entities/model/simple-model.model';
import { UnknownModel } from '../../entities/model/unknown-model.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { CommonParserSchemaService } from './common-parser-schema.service';

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

const repositoryGetInstanceSpy = jest.spyOn(ParserRepositoryService, 'getInstance');

const getMockedRepositoryInstance = () =>
	({
		addEntity: jest.fn(),
		getAllEntities: jest.fn(),
		getEntity: jest.fn(),
		hasSource: jest.fn(),
	}) as unknown as ParserRepositoryService<unknown>;

const parseSchemaEntity = jest.fn<Model, []>();

describe('common-parser-schema-service', () => {
	beforeEach(() => {
		repositoryGetInstanceSpy.mockClear();
		parseSchemaEntity.mockReset();
	});

	describe('parse-enum', () => {
		it('should make unknown model when no entries', () => {
			const repository = getMockedRepositoryInstance();
			repositoryGetInstanceSpy.mockReturnValue(repository);

			const enumObject: SchemaObject = {
				enum: [],
				type: 'integer',
				format: 'int32',
			};

			const result = CommonParserSchemaService.parseEnum(enumObject, { name: 'name' });

			expect(repository.addEntity).toHaveBeenCalled();

			expect(result).toBeInstanceOf(UnknownModel);
		});

		it('should create union model', () => {
			const repository = getMockedRepositoryInstance();
			repositoryGetInstanceSpy.mockReturnValue(repository);

			const enumObject: SchemaObject = {
				enum: [1, 2, 3],
				type: 'integer',
				format: 'int32',
			};

			(enumObject as Record<string, unknown>)['x-custom'] = true;

			const result = CommonParserSchemaService.parseEnum(enumObject, { name: 'name' });

			expect(repository.addEntity).toHaveBeenCalled();

			const expected = new ExtendedModel(
				'or',
				[
					new ConstantModel(1, { format: 'int32' }),
					new ConstantModel(2, { format: 'int32' }),
					new ConstantModel(3, { format: 'int32' }),
				],
				{
					extensions: {
						'x-custom': true,
					},
				},
			);

			expect(result).toStrictEqual(expected);
		});

		it('should use the correct entry names (x-enumNames extension)', () => {
			const repository = getMockedRepositoryInstance();
			repositoryGetInstanceSpy.mockReturnValue(repository);

			const enumObject: SchemaObject = {
				enum: [1, 2, 3],
				type: 'integer',
			};

			(enumObject as Record<string, unknown>)['x-enumNames'] = ['High', 'Medium', 'Low'];

			const result = CommonParserSchemaService.parseEnum(enumObject, { name: 'name' });

			const expectedEnumEntries = [
				new EnumEntry('High', 1),
				new EnumEntry('Medium', 2),
				new EnumEntry('Low', 3),
			];

			const expectedEnum = new EnumModel('name', 'integer', expectedEnumEntries, {
				extensions: {
					'x-enumNames': ['High', 'Medium', 'Low'],
				},
			});

			expect(result).toStrictEqual(expectedEnum);
		});

		it('should use the correct entry names (x-enum-varnames extension)', () => {
			const repository = getMockedRepositoryInstance();
			repositoryGetInstanceSpy.mockReturnValue(repository);

			const enumObject: SchemaObject = {
				enum: [1, 2, 3],
				type: 'integer',
			};

			(enumObject as Record<string, unknown>)['x-enum-varnames'] = ['High', 'Medium', 'Low'];

			const result = CommonParserSchemaService.parseEnum(enumObject, { name: 'name' });

			const expectedEnumEntries = [
				new EnumEntry('High', 1),
				new EnumEntry('Medium', 2),
				new EnumEntry('Low', 3),
			];

			const expectedEnum = new EnumModel('name', 'integer', expectedEnumEntries, {
				extensions: {
					'x-enum-varnames': ['High', 'Medium', 'Low'],
				},
			});

			expect(result).toStrictEqual(expectedEnum);
		});

		it('should use the correct entry names (x-ms-enum extension)', () => {
			const repository = getMockedRepositoryInstance();
			repositoryGetInstanceSpy.mockReturnValue(repository);

			const enumObject: SchemaObject = {
				enum: [1, 2, 3],
				type: 'integer',
			};

			const xMsEnum = {
				name: 'NameFromMsEnumExtension',
				values: [
					{ name: 'High', value: 1, description: 'High1' },
					{ name: 'Medium', value: 2, description: 'Medium2' },
					{ name: 'Low', value: 3, description: 'Low3' },
				],
			};

			(enumObject as Record<string, unknown>)['x-ms-enum'] = xMsEnum;

			const result = CommonParserSchemaService.parseEnum(enumObject, { name: 'name' });

			const expectedEnumEntries = [
				new EnumEntry('High', 1, { description: 'High1' }),
				new EnumEntry('Medium', 2, { description: 'Medium2' }),
				new EnumEntry('Low', 3, { description: 'Low3' }),
			];

			const expectedEnum = new EnumModel(
				'NameFromMsEnumExtension',
				'integer',
				expectedEnumEntries,
				{
					extensions: {
						'x-ms-enum': xMsEnum,
					},
				},
			);

			expect(result).toStrictEqual(expectedEnum);
		});
	});

	it('should create an object model', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const schema: SchemaObject = {
			type: 'object',
			additionalProperties: true,
			required: ['prop1'],
			properties: {
				prop1: { type: 'string', nullable: true },
				prop2: { type: 'integer', format: 'int32' },
			},
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(
			() => new ExtendedModel('or', [new SimpleModel('string'), new NullModel()]),
		);

		parseSchemaEntity.mockImplementationOnce(
			() => new SimpleModel('integer', { format: 'int32' }),
		);

		const result = CommonParserSchemaService.parseObject(parseSchemaEntity, schema, {
			name: 'Object',
		});

		expect(repository.addEntity).toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const properties = [
			new Property(
				'prop1',
				new ExtendedModel('or', [new SimpleModel('string'), new NullModel()]),
				{ required: true },
			),
			new Property('prop2', new SimpleModel('integer', { format: 'int32' })),
		];

		const expected = new ObjectModel('Object', {
			properties,
			additionalProperties: new UnknownModel(),
			extensions: { 'x-custom': true },
		});

		expect(result).toStrictEqual(expected);
	});

	it('should parse simple model', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const schema: SchemaObject = {
			type: 'integer',
			format: 'int64',
		};

		(schema as Record<string, unknown>)['x-custom'] = true;

		const result = CommonParserSchemaService.parseSimple('integer', 'int64', true);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).not.toHaveBeenCalled();

		const expected = new ExtendedModel('or', [
			new SimpleModel('integer', { format: 'int64' }),
			new NullModel(),
		]);

		expect(result).toStrictEqual(expected);
	});

	it('should create an array model', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const schema: SchemaObject = {
			type: 'array',
			items: {
				type: 'number',
				format: 'float',
			},
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(
			() => new SimpleModel('number', { format: 'float' }),
		);

		const result = CommonParserSchemaService.parseArray(
			parseSchemaEntity,
			schema,
			{ name: 'Array' },
			true,
		);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalled();

		const expected = new ExtendedModel('or', [
			new ArrayModel(new SimpleModel('number', { format: 'float' })),
			new NullModel(),
		]);

		expect(result).toStrictEqual(expected);
	});

	it('should get default name if no provided', () => {
		expect(CommonParserSchemaService.getNameOrDefault('Name')).toStrictEqual('Name');

		expect(CommonParserSchemaService.getNameOrDefault()).toStrictEqual('Unknown');
	});

	it('should generate enum entry name from value', () => {
		const result1 = CommonParserSchemaService.getDefaultEntryNameByValue(1);
		expect(result1).toStrictEqual('1');

		const result2 = CommonParserSchemaService.getDefaultEntryNameByValue('Name');
		expect(result2).toStrictEqual('Name');
	});

	it('should parse allOf combination', () => {
		const schema: SchemaObject = {
			allOf: [{ type: 'integer' }, { type: 'string' }],
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(() => new SimpleModel('integer'));
		parseSchemaEntity.mockImplementationOnce(() => new SimpleModel('string'));

		const result = CommonParserSchemaService.parseCombination(
			parseSchemaEntity,
			'allOf',
			schema,
		);

		expect(parseSchemaEntity).toBeCalledTimes(2);

		const expected = new ExtendedModel(
			'and',
			[new SimpleModel('integer'), new SimpleModel('string')],
			{ extensions: { 'x-custom': true } },
		);

		expect(result).toStrictEqual(expected);
	});

	it('should parse oneOf combination', () => {
		const schema: SchemaObject = {
			oneOf: [{ type: 'null' }, { type: 'string' }],
		};

		parseSchemaEntity.mockImplementationOnce(() => new NullModel());
		parseSchemaEntity.mockImplementationOnce(() => new SimpleModel('string'));

		const result = CommonParserSchemaService.parseCombination(
			parseSchemaEntity,
			'oneOf',
			schema,
		);

		expect(parseSchemaEntity).toBeCalledTimes(2);

		const expected = new ExtendedModel('or', [new NullModel(), new SimpleModel('string')]);

		expect(result).toStrictEqual(expected);
	});

	it('should parse anyOf combination', () => {
		const schema: SchemaObject = {
			anyOf: [{ type: 'string' }],
		};

		parseSchemaEntity.mockImplementationOnce(() => new SimpleModel('string'));

		const result = CommonParserSchemaService.parseCombination(
			parseSchemaEntity,
			'anyOf',
			schema,
		);

		expect(parseSchemaEntity).toBeCalledTimes(1);

		const expected = new ExtendedModel('or', [new SimpleModel('string')]);

		expect(result).toStrictEqual(expected);
	});
});
