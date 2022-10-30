import { camelCase, camelCaseTransformMerge } from 'camel-case';
import kebabCase from 'just-kebab-case';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';

export interface Type<T> extends Function {
	new (...args: any[]): T;
}

export const toPascalCase = (...parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });

export const toKebabCase = (...parts: string[]): string => kebabCase(parts.join(' '));

export const toCamelCase = (...parts: string[]): string =>
	camelCase(parts.join(' '), { transform: camelCaseTransformMerge });

export const assertUnreachable = (_: never): never => {
	throw new Error();
};

export const unresolvedSchemaReferenceError = (): Error =>
	new Error('Unresolved schema reference.');
