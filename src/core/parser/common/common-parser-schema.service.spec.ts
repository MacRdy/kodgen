import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ArrayModelDef } from '../../../core/entities/schema-entities/array-model-def.model';
import { ConstantModelDef } from '../../../core/entities/schema-entities/constant-model-def.model';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { UnknownModelDef } from '../../../core/entities/schema-entities/unknown-model-def.model';
import { ModelDef } from '../../../core/entities/shared.model';
import { EnumEntryDef, EnumModelDef } from '../../entities/schema-entities/enum-model-def.model';
import { toPascalCase } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import { CommonParserSchemaService } from './common-parser-schema.service';
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

jest.mock('../../utils');

const toPascalCaseMock = jest.mocked(toPascalCase);

const repositoryGetInstanceSpy = jest.spyOn(ParserRepositoryService, 'getInstance');

const getMockedRepositoryInstance = () =>
	({
		addEntity: jest.fn(),
		getAllEntities: jest.fn(),
		getEntity: jest.fn(),
		hasSource: jest.fn(),
	} as unknown as ParserRepositoryService<unknown>);

const parseSchemaEntity = jest.fn<ModelDef, []>();

describe('common-parser-schema', () => {
	beforeEach(() => {
		repositoryGetInstanceSpy.mockClear();
		parseSchemaEntity.mockClear();
		toPascalCaseMock.mockClear();
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

			expect(result).toBeInstanceOf(UnknownModelDef);
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

			const expected = new ExtendedModelDef(
				'or',
				[
					new ConstantModelDef(1, 'int32'),
					new ConstantModelDef(2, 'int32'),
					new ConstantModelDef(3, 'int32'),
				],
				{
					extensions: {
						'x-custom': true,
					},
				},
			);

			expect(result).toStrictEqual(expected);
		});

		it('should use the correct entry names', () => {
			const repository = getMockedRepositoryInstance();
			repositoryGetInstanceSpy.mockReturnValue(repository);

			const enumObject: SchemaObject = {
				enum: [1, 2, 3],
				type: 'integer',
			};

			(enumObject as Record<string, unknown>)['x-enumNames'] = ['High', 'Medium', 'Low'];

			const result = CommonParserSchemaService.parseEnum(enumObject, { name: 'name' });

			const expectedEnumEntries = [
				new EnumEntryDef('High', 1),
				new EnumEntryDef('Medium', 2),
				new EnumEntryDef('Low', 3),
			];

			const expectedEnum = new EnumModelDef('name', 'integer', expectedEnumEntries, {
				extensions: {
					'x-enumNames': ['High', 'Medium', 'Low'],
				},
			});

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
			() => new ExtendedModelDef('or', [new SimpleModelDef('string'), new NullModelDef()]),
		);

		parseSchemaEntity.mockImplementationOnce(
			() => new SimpleModelDef('integer', { format: 'int32' }),
		);

		const result = CommonParserSchemaService.parseObject(parseSchemaEntity, schema, {
			name: 'Object',
		});

		expect(repository.addEntity).toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const properties = [
			new Property(
				'prop1',
				new ExtendedModelDef('or', [new SimpleModelDef('string'), new NullModelDef()]),
				{ required: true },
			),
			new Property('prop2', new SimpleModelDef('integer', { format: 'int32' })),
		];

		const expected = new ObjectModelDef('Object', {
			properties,
			additionalProperties: new UnknownModelDef(),
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

		const expected = new ExtendedModelDef('or', [
			new SimpleModelDef('integer', { format: 'int64' }),
			new NullModelDef(),
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
			() => new SimpleModelDef('number', { format: 'float' }),
		);

		const result = CommonParserSchemaService.parseArray(
			parseSchemaEntity,
			schema,
			{ name: 'Array' },
			true,
		);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalled();

		const expected = new ExtendedModelDef('or', [
			new ArrayModelDef(new SimpleModelDef('number', { format: 'float' })),
			new NullModelDef(),
		]);

		expect(result).toStrictEqual(expected);
	});

	it('should get default name if no provided', () => {
		expect(CommonParserSchemaService.getNameOrDefault('Name')).toStrictEqual('Name');

		expect(CommonParserSchemaService.getNameOrDefault()).toStrictEqual('Unknown');
	});

	it('should generate enum entry name from value', () => {
		const result1 = CommonParserSchemaService.generateEnumEntryNameByValue(1);
		expect(result1).toStrictEqual('_1');

		toPascalCaseMock.mockImplementationOnce(x => x);

		const result2 = CommonParserSchemaService.generateEnumEntryNameByValue('Name');
		expect(result2).toStrictEqual('Name');
	});

	it('should parse allOf combination', () => {
		const schema: SchemaObject = {
			allOf: [{ type: 'integer' }, { type: 'string' }],
		};

		(schema as unknown as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('integer'));
		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('string'));

		const result = CommonParserSchemaService.parseCombination(
			parseSchemaEntity,
			'allOf',
			schema,
		);

		expect(parseSchemaEntity).toBeCalledTimes(2);

		const expected = new ExtendedModelDef(
			'and',
			[new SimpleModelDef('integer'), new SimpleModelDef('string')],
			{ extensions: { 'x-custom': true } },
		);

		expect(result).toStrictEqual(expected);
	});

	it('should parse oneOf combination', () => {
		const schema: SchemaObject = {
			oneOf: [{ type: 'null' }, { type: 'string' }],
		};

		parseSchemaEntity.mockImplementationOnce(() => new NullModelDef());
		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('string'));

		const result = CommonParserSchemaService.parseCombination(
			parseSchemaEntity,
			'oneOf',
			schema,
		);

		expect(parseSchemaEntity).toBeCalledTimes(2);

		const expected = new ExtendedModelDef('or', [
			new NullModelDef(),
			new SimpleModelDef('string'),
		]);

		expect(result).toStrictEqual(expected);
	});

	it('should parse anyOf combination', () => {
		const schema: SchemaObject = {
			anyOf: [{ type: 'string' }],
		};

		parseSchemaEntity.mockImplementationOnce(() => new SimpleModelDef('string'));

		const result = CommonParserSchemaService.parseCombination(
			parseSchemaEntity,
			'anyOf',
			schema,
		);

		expect(parseSchemaEntity).toBeCalledTimes(1);

		const expected = new ExtendedModelDef('or', [new SimpleModelDef('string')]);

		expect(result).toStrictEqual(expected);
	});
});
