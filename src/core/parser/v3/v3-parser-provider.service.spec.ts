import { OpenAPIV3 } from 'openapi-types';
import { V3ParserProviderService } from './v3-parser-provider.service';
import { V3ParserService } from './v3-parser.service';

jest.mock('./v3-parser.service');

const v3ParserServiceMock = jest.mocked(V3ParserService);

describe('v3-parser-provider', () => {
	beforeEach(() => {
		v3ParserServiceMock.mockClear();
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
			const service = new V3ParserProviderService();

			const doc: OpenAPIV3.Document = {
				info: { title: '', version: '' },
				paths: {},
				openapi: version,
			};

			expect(service.isSupported(doc)).toStrictEqual(isSupported);
		},
	);

	it('should create parser instance', () => {
		const service = new V3ParserProviderService();

		const doc: OpenAPIV3.Document = {
			info: { title: '', version: '' },
			paths: {},
			openapi: '3.0.1',
		};

		service.create(doc);

		expect(v3ParserServiceMock).toHaveBeenCalledTimes(1);
	});
});
