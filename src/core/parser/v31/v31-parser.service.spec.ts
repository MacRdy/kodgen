import { validate } from '@apidevtools/swagger-parser';
import { OpenAPIV3_1 } from 'openapi-types';
import { CommonParserService } from '../common/common-parser.service';
import { V31ParserService } from './v31-parser.service';

jest.mock('@apidevtools/swagger-parser');

const validateGlobalMock = jest.mocked(validate);

describe('v31-parser', () => {
	beforeEach(() => {
		validateGlobalMock.mockClear();
	});

	const supportedVersionTable = [
		{ version: '3.1.0', isSupported: true },
		{ version: '3.0.2', isSupported: false },
		{ version: '3.0.1', isSupported: false },
		{ version: '3.0.0', isSupported: false },
		{ version: '2.0', isSupported: false },
		{ version: '1.2', isSupported: false },
		{ version: '1.1', isSupported: false },
		{ version: '1.0', isSupported: false },
	];

	it.each(supportedVersionTable)(
		'should detect supported version correctly ($version, $isSupported)',
		({ version, isSupported }) => {
			const service = new V31ParserService();

			const doc: OpenAPIV3_1.Document = {
				info: { title: '', version: '' },
				paths: {},
				openapi: version,
			};

			expect(service.isSupported(doc)).toStrictEqual(isSupported);
		},
	);

	it('should validate spec', async () => {
		const service = new V31ParserService();

		await service.validate({ info: { title: '', version: '' }, openapi: '', components: [] });

		expect(validate).toBeCalledTimes(1);
	});

	it('should call common parser', () => {
		const parseSpy = jest.spyOn(CommonParserService, 'parse');

		const service = new V31ParserService();

		const doc: OpenAPIV3_1.Document = {
			info: { title: '', version: '' },
			paths: {},
			openapi: '3.1.0',
		};

		service.parse(doc);

		expect(parseSpy).toHaveBeenCalledTimes(1);

		parseSpy.mockRestore();
	});
});
