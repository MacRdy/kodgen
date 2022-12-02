import { OpenAPIV3 } from 'openapi-types';
import { Config } from '../../config/config';
import { V3ParserService } from './v3-parser.service';

describe('v3-parser', () => {
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
			const configGetSpy = jest.spyOn(Config, 'get');

			configGetSpy.mockReturnValueOnce({
				generator: '',
				input: '',
				output: './output',
			});

			const service = new V3ParserService();

			const doc: OpenAPIV3.Document = {
				info: { title: '', version: '' },
				paths: {},
				openapi: version,
			};

			expect(service.isSupported(doc)).toStrictEqual(isSupported);

			configGetSpy.mockRestore();
		},
	);
});
