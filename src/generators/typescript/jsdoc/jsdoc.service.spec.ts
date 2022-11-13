import { JSDocRecordKey, JSDocRecords } from './jsdoc.model';
import { JSDocService } from './jsdoc.service';

describe('jsdoc', () => {
	it('should handle records correctly', () => {
		const records = new JSDocRecords();

		expect(records.get()).toStrictEqual({});

		records.set(JSDocRecordKey.Description, 'description1');

		expect(records.get()).toStrictEqual({ '@description': ['description1'] });

		records.set(JSDocRecordKey.Description, 'description2');

		expect(records.get()).toStrictEqual({ '@description': ['description1', 'description2'] });

		records.set(JSDocRecordKey.Deprecated);

		expect(records.get()).toStrictEqual({
			'@description': ['description1', 'description2'],
			'@deprecated': [],
		});
	});

	it('should generate simple comment', () => {
		const service = new JSDocService();

		const comment = service.build({ summaries: ['summary1'] });

		const expected = '/** @summary summary1 */';

		expect(comment).toStrictEqual(expected);
	});

	it('should generate simple comment with custom indention', () => {
		const service = new JSDocService('  ');

		const comment = service.build({ deprecated: true }, 2);

		expect(comment).toStrictEqual('    /** @deprecated */');
	});

	it('should generate complex comment', () => {
		const service = new JSDocService();

		const comment = service.build({
			summaries: ['Summary1', 'Summary2'],
			descriptions: ['Description'],
			params: [
				{ name: 'p1', type: 'string', description: 'First parameter' },
				{ name: 'p2', type: 'number', description: 'Second parameter' },
				{ name: 'p3', type: 'boolean', optional: true },
			],
			returns: {
				type: 'string',
				description: 'Result',
			},
			deprecated: true,
		});

		const expectedContent = [
			' * @deprecated',
			'@summary Summary1',
			'@summary Summary2',
			'@description Description',
			'@param {string} p1 - First parameter',
			'@param {number} p2 - Second parameter',
			'@param {boolean} [p3]',
			'@returns {string} Result',
		].join('\n * ');

		const expected = ['/**', expectedContent, ' */'].join('\n');

		expect(comment).toStrictEqual(expected);
	});
});
