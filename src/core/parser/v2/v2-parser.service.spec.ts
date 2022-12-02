import { OpenAPIV2 } from 'openapi-types';
import { Config } from '../../config/config';
import { V2ParserService } from './v2-parser.service';

describe('v3-parser', () => {
	const supportedVersionTable = [
		{ version: '3.1', isSupported: false },
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
			const configGetSpy = jest.spyOn(Config, 'get');

			configGetSpy.mockReturnValueOnce({
				generator: '',
				input: '',
				output: './output',
			});

			const service = new V2ParserService();

			const doc: OpenAPIV2.Document = {
				info: { title: '', version: '' },
				paths: {},
				swagger: version,
			};

			expect(service.isSupported(doc)).toStrictEqual(isSupported);

			configGetSpy.mockRestore();
		},
	);
});
