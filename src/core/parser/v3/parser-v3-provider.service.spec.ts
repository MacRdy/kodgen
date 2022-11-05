import { OpenAPIV3 } from 'openapi-types';
import { ParserV3ProviderService } from './parser-v3-provider.service';
import { ParserV3Service } from './parser-v3.service';

jest.mock('./parser-v3.service');

const parserV3ServiceMock = jest.mocked(ParserV3Service);

describe('parser-v3-provider', () => {
	beforeEach(() => {
		parserV3ServiceMock.mockClear();
	});

	const supportedVersionTable = [
		{ version: '3.1', isSupported: false },
		{ version: '3.0.2', isSupported: true },
		{ version: '3.0.1', isSupported: true },
		{ version: '3.0.0', isSupported: true },
		{ version: '2.0', isSupported: false },
		{ version: '1.2', isSupported: false },
		{ version: '1.1', isSupported: false },
		{ version: '1.0', isSupported: false },
	];

	it.each(supportedVersionTable)(
		'should detect supported version correctly ($version, $isSupported)',
		({ version, isSupported }) => {
			const service = new ParserV3ProviderService();

			const doc: OpenAPIV3.Document = {
				info: { title: '', version: '' },
				paths: {},
				openapi: version,
			};

			expect(service.isSupported(doc)).toStrictEqual(isSupported);
		},
	);

	it('should create parser instance', () => {
		const service = new ParserV3ProviderService();

		const doc: OpenAPIV3.Document = {
			info: { title: '', version: '' },
			paths: {},
			openapi: '3.0.1',
		};

		service.create(doc);

		expect(parserV3ServiceMock).toHaveBeenCalledTimes(1);
	});
});
