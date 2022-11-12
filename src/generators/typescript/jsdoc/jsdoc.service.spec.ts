import { JSDocService } from './jsdoc.service';

describe('jsdoc', () => {
	it('should generate simple comment', () => {
		const service = new JSDocService();

		const comment = service.method({ name: 'methodName' });

		const expected = '/** @method methodName */';

		expect(comment).toStrictEqual(expected);
	});

	it('should generate simple comment with custom indention', () => {
		const service = new JSDocService('  ');

		const comment = service.method({ descriptions: ['Test description'] }, 2);

		const expectedContent = ['     * @method', '@description Test description'].join(
			'\n     * ',
		);

		const expected = ['    /**', expectedContent, '     */'].join('\n');

		expect(comment).toStrictEqual(expected);
	});

	it('should generate complex comment', () => {
		const service = new JSDocService();

		const comment = service.method({
			name: 'methodName',
			summaries: ['Summary1', 'Summary2'],
			descriptions: ['Description'],
			params: [
				{ name: 'p1', type: 'string', description: 'First parameter' },
				{ name: 'p2', type: 'number', description: 'Second parameter' },
				{ name: 'p3', type: 'boolean' },
			],
			returns: {
				type: 'string',
				description: 'Result',
			},
			deprecated: true,
		});

		const expectedContent = [
			' * @method methodName',
			'@deprecated',
			'@summary Summary1',
			'@summary Summary2',
			'@description Description',
			'@param {string} p1 - First parameter',
			'@param {number} p2 - Second parameter',
			'@param {boolean} p3',
			'@returns {string} Result',
		].join('\n * ');

		const expected = ['/**', expectedContent, ' */'].join('\n');

		expect(comment).toStrictEqual(expected);
	});
});
