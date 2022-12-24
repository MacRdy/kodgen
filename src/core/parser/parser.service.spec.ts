import { dereference } from '@apidevtools/swagger-parser';
import { load } from 'js-yaml';
import { ParserService } from './parser.service';
import { V2ParserService } from './v2/v2-parser.service';
import { V3ParserService } from './v3/v3-parser.service';
import { V31ParserService } from './v31/v31-parser.service';

jest.mock('@apidevtools/swagger-parser');
jest.mock('js-yaml');

jest.mock('./v2/v2-parser.service');
jest.mock('./v3/v3-parser.service');
jest.mock('./v31/v31-parser.service');

const jsYamlLoadMock = jest.mocked(load);
const swaggerParserDereferenceMock = jest.mocked(dereference);

const v2ParserServiceMock = jest.mocked(V2ParserService);
const v3ParserServiceMock = jest.mocked(V3ParserService);
const v31ParserServiceMock = jest.mocked(V31ParserService);

describe('parser', () => {
	beforeEach(() => {
		jsYamlLoadMock.mockClear();
		swaggerParserDereferenceMock.mockClear();

		v2ParserServiceMock.mockClear();
		v3ParserServiceMock.mockClear();
		v31ParserServiceMock.mockClear();
	});

	it('should parse schema correctly', async () => {
		const service = new ParserService();

		v31ParserServiceMock.prototype.isSupported.mockReturnValue(true);

		await service.parse('');

		expect(v2ParserServiceMock.prototype.isSupported).toBeCalledTimes(1);
		expect(v3ParserServiceMock.prototype.isSupported).toBeCalledTimes(1);
		expect(v31ParserServiceMock.prototype.isSupported).toBeCalledTimes(1);

		expect(jsYamlLoadMock).toBeCalledTimes(1);
		expect(swaggerParserDereferenceMock).toBeCalledTimes(1);

		expect(v2ParserServiceMock.prototype.parse).not.toBeCalled();
		expect(v3ParserServiceMock.prototype.parse).not.toBeCalled();
		expect(v31ParserServiceMock.prototype.parse).toBeCalledTimes(1);
	});

	it('should throw an error with invalid schema', async () => {
		v2ParserServiceMock.prototype.isSupported.mockReturnValue(false);
		v3ParserServiceMock.prototype.isSupported.mockReturnValue(false);
		v31ParserServiceMock.prototype.isSupported.mockReturnValue(false);

		const service = new ParserService();

		await expect(service.parse('')).rejects.toThrow('Unsupported OpenAPI version');
	});
});
