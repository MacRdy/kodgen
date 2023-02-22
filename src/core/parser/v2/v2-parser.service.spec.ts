import { validate } from '@apidevtools/swagger-parser';
import { OpenAPIV2 } from 'openapi-types';
import { CommonParserService } from '../common/common-parser.service';
import { V2ParserService } from './v2-parser.service';

jest.mock('@apidevtools/swagger-parser');

const validateGlobalMock = jest.mocked(validate);

describe('v2-parser-service', () => {
	beforeEach(() => {
		validateGlobalMock.mockClear();
	});

	const supportedVersionTable = [
		{ version: '3.1.0', isSupported: false },
		{ version: '3.0.2', isSupported: false },
		{ version: '3.0.1', isSupported: false },
		{ version: '3.0.0', isSupported: false },
		{ version: '2.0', isSupported: true },
		{ version: '1.2', isSupported: false },
		{ version: '1.1', isSupported: false },
		{ version: '1.0', isSupported: false },
	];

	it.each(supportedVersionTable)(
		'should detect supported version correctly ($version, $isSupported)',
		({ version, isSupported }) => {
			const service = new V2ParserService();

			const doc: OpenAPIV2.Document = {
				info: { title: '', version: '' },
				paths: {},
				swagger: version,
			};

			expect(service.isSupported(doc)).toStrictEqual(isSupported);
		},
	);

	it('should validate spec', async () => {
		const service = new V2ParserService();

		await service.validate({ info: { title: '', version: '' }, swagger: '', paths: {} });

		expect(validate).toBeCalledTimes(1);
	});

	it('should call common parser', () => {
		const parseSpy = jest.spyOn(CommonParserService, 'parse');

		const service = new V2ParserService();

		const doc: OpenAPIV2.Document = {
			info: { title: '', version: '' },
			paths: {},
			swagger: '2.0',
		};

		service.parse(doc);

		expect(parseSpy).toHaveBeenCalledTimes(1);

		parseSpy.mockRestore();
	});
});
