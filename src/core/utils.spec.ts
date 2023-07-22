import { generateAjvErrorMessage } from './utils';

describe('utils', () => {
	it('should handle ajv error messages correctly', () => {
		expect(
			generateAjvErrorMessage('Invalid configuration', [
				{
					keyword: 'keyword',
					params: {},
					schemaPath: 'schemaPath',
					instancePath: 'instancePath',
					message: 'message',
				},
			]),
		).toStrictEqual(`Invalid configuration\n- instancePath message`);
	});
});
