import { FileService } from './file/file.service';
import {
	getAjvValidateErrorMessage,
	getCommandConfig,
	mergeParts,
	toCamelCase,
	toKebabCase,
	toPascalCase,
} from './utils';

jest.mock('./file/file.service');

const fileServiceGlobalMock = jest.mocked(FileService);

describe('utils', () => {
	beforeEach(() => {
		fileServiceGlobalMock.mockClear();
	});

	describe('mergeParts', () => {
		it('should merge string parts with spaces', () => {
			expect(mergeParts('p1', 'p2', 'p3')).toStrictEqual('p1 p2 p3');
		});

		it('should stay all characters', () => {
			expect(mergeParts('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual(
				'!@#$%^&*()\\/,.?<>{}[];:\'"1word',
			);
		});
	});

	describe('toPascalCase', () => {
		it('should transform string parts to pascal case without spaces', () => {
			expect(toPascalCase('pascal', 'case', ' string')).toStrictEqual('PascalCaseString');
		});

		it('should remain only letters and numbers', () => {
			expect(toPascalCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	describe('toKebabCase', () => {
		it('should transform string parts to kebab case without spaces', () => {
			expect(toKebabCase('kebab', 'case', ' string')).toStrictEqual('kebab-case-string');
		});

		it('should remain only letters and numbers', () => {
			expect(toKebabCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	describe('toCamelCase', () => {
		it('should transform string parts to camel case without spaces', () => {
			expect(toCamelCase('camel', 'case', ' string')).toStrictEqual('camelCaseString');
		});

		it('should remain only letters and numbers', () => {
			expect(toCamelCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	it('should handle ajv error messages correctly', () => {
		expect(getAjvValidateErrorMessage()).toStrictEqual(
			`Invalid configuration:\n- Unknown error`,
		);

		expect(
			getAjvValidateErrorMessage([
				{
					keyword: 'keyword',
					params: {},
					schemaPath: 'schemaPath',
					instancePath: 'instancePath',
					message: 'message',
				},
			]),
		).toStrictEqual(`Invalid configuration:\n- instancePath message`);
	});

	it('should load user config', async () => {
		await expect(getCommandConfig()).resolves.toBeUndefined();

		await expect(getCommandConfig('path')).rejects.toThrow('Config not found');

		fileServiceGlobalMock.prototype.exists.mockReturnValueOnce(true);
		fileServiceGlobalMock.prototype.loadFile.mockResolvedValueOnce({ test: true });

		await expect(getCommandConfig('path ')).resolves.toStrictEqual({ test: true });

		const fileService = jest.mocked(fileServiceGlobalMock.mock.instances[1]);

		expect(fileService?.exists).toBeCalledWith('path');
		expect(fileService?.loadFile).toBeCalledWith('path');
	});
});
