import { OpenAPIV2 } from 'openapi-types';
import { UnknownModelDef } from '../../entities/schema-entities/unknown-model-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { IParseSchemaData, schemaWarning } from '../parser.model';
import { V2ParserSchemaService } from './v2-parser-schema.service';

jest.mock('../parser.model');

const schemaWarningMock = jest.mocked(schemaWarning);
const parseSchemaEntity = jest.fn<SchemaEntity, []>();

describe('v2-parser-schema', () => {
	beforeEach(() => {
		parseSchemaEntity.mockClear();
		schemaWarningMock.mockClear();
	});

	it('should call common parser for enum', () => {
		const service = new V2ParserSchemaService(parseSchemaEntity);

		const parseEnumSpy = jest.spyOn(CommonParserSchemaService, 'parseEnum');

		const schema: OpenAPIV2.SchemaObject = { enum: [], type: 'integer', 'x-nullable': true };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseEnumSpy).toBeCalledTimes(1);
		expect(parseEnumSpy).toBeCalledWith(schema, data, true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseEnumSpy.mockRestore();
	});

	it('should call common parser for object', () => {
		const service = new V2ParserSchemaService(parseSchemaEntity);

		const parseObjectSpy = jest.spyOn(CommonParserSchemaService, 'parseObject');

		const schema: OpenAPIV2.SchemaObject = { type: 'object', 'x-nullable': true };
		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseObjectSpy).toBeCalledTimes(1);
		expect(parseObjectSpy).toBeCalledWith(parseSchemaEntity, schema, data, true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseObjectSpy.mockRestore();
	});

	it('should call common parser for array', () => {
		const service = new V2ParserSchemaService(parseSchemaEntity);

		const parseArraySpy = jest.spyOn(CommonParserSchemaService, 'parseArray');

		const schema: OpenAPIV2.SchemaObject = {
			type: 'array',
			items: { type: 'integer' },
			'x-nullable': true,
		};

		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseArraySpy).toBeCalledTimes(1);
		expect(parseArraySpy).toBeCalledWith(parseSchemaEntity, schema, data, true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseArraySpy.mockRestore();
	});

	it('should call common parser for simple model', () => {
		const service = new V2ParserSchemaService(parseSchemaEntity);

		const parseSimpleSpy = jest.spyOn(CommonParserSchemaService, 'parseSimple');

		const schema: OpenAPIV2.SchemaObject = {
			type: 'integer',
			format: 'int64',
			'x-nullable': true,
		};

		const data: IParseSchemaData = { name: 'Name' };

		service.parse(schema, data);

		expect(parseSimpleSpy).toBeCalledTimes(1);
		expect(parseSimpleSpy).toBeCalledWith('integer', 'int64', true);
		expect(schemaWarning).not.toHaveBeenCalled();

		parseSimpleSpy.mockRestore();
	});

	it('should return unknown type on invalid data', () => {
		const service = new V2ParserSchemaService(parseSchemaEntity);

		const result = service.parse({});

		expect(schemaWarning).toBeCalledTimes(1);
		expect(result).toBeInstanceOf(UnknownModelDef);
	});
});
