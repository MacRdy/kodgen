import { OpenAPIV3_1 } from 'openapi-types';
import { EnumEntry, EnumModelDef } from '../../entities/model/enum-model-def.model';
import { ExtendedModelDef } from '../../entities/model/extended-model-def.model';
import { UnknownModelDef } from '../../entities/model/unknown-model-def.model';
import { ModelDef } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { getExtensions, IParseSchemaData, schemaWarning } from '../parser.model';
import { V31ParserSchemaService } from './v31-parser-schema.service';

jest.mock('../parser.model');

const getExtensionsMock = jest.mocked(getExtensions);
const schemaWarningMock = jest.mocked(schemaWarning);
const parseSchemaEntity = jest.fn<ModelDef, []>();

describe('v31-parser-schema-service', () => {
	beforeEach(() => {
		parseSchemaEntity.mockClear();
		schemaWarningMock.mockClear();
		getExtensionsMock.mockClear();
	});

	it('should call common parser for enum', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const parseEnumSpy = jest.spyOn(CommonParserSchemaService, 'parseEnum');
		parseEnumSpy.mockImplementation(jest.fn());

		const schema: OpenAPIV3_1.SchemaObject = { enum: [], type: 'integer' };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseEnumSpy).toBeCalledTimes(1);
		expect(parseEnumSpy).toBeCalledWith(schema, data);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseEnumSpy.mockRestore();
	});

	it('should call common parser for combination', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const parseCombinationSpy = jest.spyOn(CommonParserSchemaService, 'parseCombination');

		const allOfSchema: OpenAPIV3_1.SchemaObject = { allOf: [{}] };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(allOfSchema, data);

		expect(parseCombinationSpy).toBeCalledTimes(1);
		expect(parseCombinationSpy).lastCalledWith(parseSchemaEntity, 'allOf', allOfSchema, data);

		const oneOfSchema: OpenAPIV3_1.SchemaObject = { oneOf: [{}] };
		service.parse(oneOfSchema, data);

		expect(parseCombinationSpy).toBeCalledTimes(2);
		expect(parseCombinationSpy).lastCalledWith(parseSchemaEntity, 'oneOf', oneOfSchema, data);

		const anyOfSchema: OpenAPIV3_1.SchemaObject = { anyOf: [{}] };
		service.parse(anyOfSchema, data);

		expect(parseCombinationSpy).toBeCalledTimes(3);
		expect(parseCombinationSpy).lastCalledWith(parseSchemaEntity, 'anyOf', anyOfSchema, data);

		expect(schemaWarning).not.toHaveBeenCalled();

		parseCombinationSpy.mockRestore();
	});

	it('should call common parser for object', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const parseObjectSpy = jest.spyOn(CommonParserSchemaService, 'parseObject');

		const schema: OpenAPIV3_1.SchemaObject = { type: 'object' };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseObjectSpy).toBeCalledTimes(1);
		expect(parseObjectSpy).toBeCalledWith(parseSchemaEntity, schema, data);
		expect(schemaWarning).toBeCalled();

		parseObjectSpy.mockRestore();
	});

	it('should call common parser for array', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const parseArraySpy = jest.spyOn(CommonParserSchemaService, 'parseArray');

		const schema: OpenAPIV3_1.SchemaObject = {
			type: 'array',
			items: { type: 'integer' },
		};

		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseArraySpy).toBeCalledTimes(1);
		expect(parseArraySpy).toBeCalledWith(parseSchemaEntity, schema, data);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseArraySpy.mockRestore();
	});

	it('should call common parser for one simple model', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const parseSimpleSpy = jest.spyOn(CommonParserSchemaService, 'parseSimple');

		const schema: OpenAPIV3_1.SchemaObject = {
			type: 'integer',
			format: 'int64',
		};

		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseSimpleSpy).toBeCalledTimes(1);
		expect(parseSimpleSpy).toBeCalledWith('integer', 'int64');
		expect(schemaWarning).not.toHaveBeenCalled();

		parseSimpleSpy.mockRestore();
	});

	it('should call common parser for multiple simple models', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const parseSimpleSpy = jest.spyOn(CommonParserSchemaService, 'parseSimple');

		const schema: OpenAPIV3_1.SchemaObject = {
			type: ['integer', 'string', 'null'],
			format: 'custom-format',
		};

		const data: IParseSchemaData = { name: 'Name' };

		const result = service.parse(schema, data);

		expect(parseSimpleSpy).toBeCalledTimes(2);

		expect(parseSimpleSpy).nthCalledWith(1, 'integer', 'custom-format');
		expect(parseSimpleSpy).nthCalledWith(2, 'string', 'custom-format');

		expect(result).toBeInstanceOf(ExtendedModelDef);

		expect((result as ExtendedModelDef).type).toStrictEqual('or');
		expect((result as ExtendedModelDef).def.length).toStrictEqual(3);

		expect(schemaWarning).not.toHaveBeenCalled();

		parseSimpleSpy.mockRestore();
	});

	it('should return unknown type on invalid data', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const result = service.parse({});

		expect(schemaWarning).toBeCalledTimes(1);
		expect(result).toBeInstanceOf(UnknownModelDef);
	});

	it('should parse oneOf as enum', () => {
		const service = new V31ParserSchemaService(parseSchemaEntity);

		const schema: OpenAPIV3_1.SchemaObject = {
			type: 'integer',
			oneOf: [
				{
					title: 'HIGH',
					const: 2,
					description: 'An urgent problem',
					'x-custom': true,
				} as OpenAPIV3_1.SchemaObject,
				{
					title: 'MEDIUM',
					const: 1,
					deprecated: true,
				} as OpenAPIV3_1.SchemaObject,
				{
					const: 0,
					description: 'Can wait forever',
				} as OpenAPIV3_1.SchemaObject,
			],
		};

		getExtensionsMock.mockImplementationOnce(() => ({ 'x-custom': true }));

		const result = service.parse(schema, { name: 'OneOfEnum', originalName: true });

		const expected: EnumModelDef = new EnumModelDef(
			'OneOfEnum',
			'integer',
			[
				new EnumEntry('HIGH', 2, {
					description: 'An urgent problem',
					extensions: { 'x-custom': true },
				}),
				new EnumEntry('MEDIUM', 1, {
					deprecated: true,
				}),
				new EnumEntry('0', 0, {
					description: 'Can wait forever',
				}),
			],
			{
				originalName: true,
			},
		);

		expect(getExtensions).toBeCalledTimes(4);

		expect(result).toBeInstanceOf(EnumModelDef);
		expect(result).toStrictEqual(expected);
	});
});
