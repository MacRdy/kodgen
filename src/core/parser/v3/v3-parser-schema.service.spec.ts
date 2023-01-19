import { OpenAPIV3 } from 'openapi-types';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { ModelDef } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { IParseSchemaData, schemaWarning } from '../parser.model';
import { V3ParserSchemaService } from './v3-parser-schema.service';

jest.mock('../parser.model');

const schemaWarningMock = jest.mocked(schemaWarning);
const parseSchemaEntity = jest.fn<ModelDef, []>();

describe('v3-parser-schema', () => {
	beforeEach(() => {
		parseSchemaEntity.mockClear();
		schemaWarningMock.mockClear();
	});

	it('should call common parser for enum', () => {
		const service = new V3ParserSchemaService(parseSchemaEntity);

		const parseEnumSpy = jest.spyOn(CommonParserSchemaService, 'parseEnum');
		parseEnumSpy.mockImplementation(jest.fn());

		const schema: OpenAPIV3.SchemaObject = { enum: [], type: 'integer', nullable: true };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseEnumSpy).toBeCalledTimes(1);
		expect(parseEnumSpy).toBeCalledWith(schema, data, true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseEnumSpy.mockRestore();
	});

	it('should call common parser for combination', () => {
		const service = new V3ParserSchemaService(parseSchemaEntity);

		const parseCombinationSpy = jest.spyOn(CommonParserSchemaService, 'parseCombination');

		const allOfSchema: OpenAPIV3.SchemaObject = { allOf: [{}] };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(allOfSchema, data);

		expect(parseCombinationSpy).toBeCalledTimes(1);
		expect(parseCombinationSpy).lastCalledWith(parseSchemaEntity, 'allOf', allOfSchema, data);

		const oneOfSchema: OpenAPIV3.SchemaObject = { oneOf: [{}] };
		service.parse(oneOfSchema, data);

		expect(parseCombinationSpy).toBeCalledTimes(2);
		expect(parseCombinationSpy).lastCalledWith(parseSchemaEntity, 'oneOf', oneOfSchema, data);

		const anyOfSchema: OpenAPIV3.SchemaObject = { anyOf: [{}] };
		service.parse(anyOfSchema, data);

		expect(parseCombinationSpy).toBeCalledTimes(3);
		expect(parseCombinationSpy).lastCalledWith(parseSchemaEntity, 'anyOf', anyOfSchema, data);

		expect(schemaWarning).not.toHaveBeenCalled();

		parseCombinationSpy.mockRestore();
	});

	it('should call common parser for object', () => {
		const service = new V3ParserSchemaService(parseSchemaEntity);

		const parseObjectSpy = jest.spyOn(CommonParserSchemaService, 'parseObject');

		const schema: OpenAPIV3.SchemaObject = { type: 'object', nullable: true };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseObjectSpy).toBeCalledTimes(1);
		expect(parseObjectSpy).toBeCalledWith(parseSchemaEntity, schema, data, true);
		expect(schemaWarning).toBeCalled();

		parseObjectSpy.mockRestore();
	});

	it('should call common parser for array', () => {
		const service = new V3ParserSchemaService(parseSchemaEntity);

		const parseArraySpy = jest.spyOn(CommonParserSchemaService, 'parseArray');

		const schema: OpenAPIV3.SchemaObject = {
			type: 'array',
			items: { type: 'integer' },
			nullable: true,
		};

		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseArraySpy).toBeCalledTimes(1);
		expect(parseArraySpy).toBeCalledWith(parseSchemaEntity, schema, data, true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseArraySpy.mockRestore();
	});

	it('should call common parser for simple model', () => {
		const service = new V3ParserSchemaService(parseSchemaEntity);

		const parseSimpleSpy = jest.spyOn(CommonParserSchemaService, 'parseSimple');

		const schema: OpenAPIV3.SchemaObject = {
			type: 'integer',
			format: 'int64',
			nullable: true,
		};

		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseSimpleSpy).toBeCalledTimes(1);
		expect(parseSimpleSpy).toBeCalledWith('integer', 'int64', true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseSimpleSpy.mockRestore();
	});

	it('should return unknown type on invalid data', () => {
		const service = new V3ParserSchemaService(parseSchemaEntity);

		const result = service.parse({});

		expect(schemaWarning).toBeCalledTimes(1);
		expect(result).toBeInstanceOf(UnknownModelDef);
	});
});
