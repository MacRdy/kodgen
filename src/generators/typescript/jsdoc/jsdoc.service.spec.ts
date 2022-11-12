import { JSDocService } from './jsdoc.service';

describe('jsdoc', () => {
	it('should generate simple comment', () => {
		const service = new JSDocService();

		const comment = service.method({ descriptions: 'Test description' });

		const expected = '/** Test description */';

		expect(comment).toStrictEqual(expected);
	});

	it('should generate simple comment with custom indention', () => {
		const service = new JSDocService('  ');

		const comment = service.method({ descriptions: 'Test description' }, 2);

		const expected = '    /** Test description */';

		expect(comment).toStrictEqual(expected);
	});

	it('should generate complex comment', () => {
		const service = new JSDocService();

		const comment = service.method({
			descriptions: 'Method description',
			params: [
				{ name: 'p1', type: 'string', description: 'First parameter' },
				{ name: 'p2', type: 'number', description: 'Second parameter' },
				{ name: 'p3', type: 'boolean' },
			],
			return: {
				type: 'string',
				description: 'Result',
			},
			deprecated: true,
		});

		const expectedContent = [
			' * Method description',
			'@deprecated',
			'@param {string} p1 - First parameter',
			'@param {number} p2 - Second parameter',
			'@param {boolean} p3',
			'@returns {string} Result',
		].join('\n * ');

		const expected = ['/**', expectedContent, ' */'].join('\n');

		expect(comment).toStrictEqual(expected);
	});
});
