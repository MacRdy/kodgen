import { OpenAPIV2 } from 'openapi-types';
import { CommonParserService } from '../common/common-parser.service';
import { V2ParserService } from './v2-parser.service';

describe('v2-parser', () => {
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
