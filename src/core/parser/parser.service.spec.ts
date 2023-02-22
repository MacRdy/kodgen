import { ParserService } from './parser.service';
import { V2ParserService } from './v2/v2-parser.service';
import { V3ParserService } from './v3/v3-parser.service';
import { V31ParserService } from './v31/v31-parser.service';

jest.mock('./v2/v2-parser.service');
jest.mock('./v3/v3-parser.service');
jest.mock('./v31/v31-parser.service');

const v2ParserServiceMock = jest.mocked(V2ParserService);
const v3ParserServiceMock = jest.mocked(V3ParserService);
const v31ParserServiceMock = jest.mocked(V31ParserService);

describe('parser-service', () => {
	beforeEach(() => {
		v2ParserServiceMock.mockClear();
		v3ParserServiceMock.mockClear();
		v31ParserServiceMock.mockClear();
	});

	it('should try to find related parser', () => {
		const service = new ParserService();

		service.get({ info: { title: '', version: '' }, openapi: '', swagger: '', components: [] });

		expect(v2ParserServiceMock.prototype.isSupported).toBeCalledTimes(1);
		expect(v3ParserServiceMock.prototype.isSupported).toBeCalledTimes(1);
		expect(v31ParserServiceMock.prototype.isSupported).toBeCalledTimes(1);
	});
});
