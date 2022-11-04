import { mergeParts, toCamelCase, toKebabCase, toPascalCase } from './utils';

describe('utils', () => {
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
});
