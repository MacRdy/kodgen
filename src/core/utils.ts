import { camelCase, camelCaseTransformMerge } from 'camel-case';
import kebabCase from 'just-kebab-case';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';

export interface Type<T> extends Function {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): T;
}

export const mergeParts = (...parts: string[]): string =>
	parts
		.map(x => x.trim())
		.filter(Boolean)
		.join(' ');

export const toPascalCase = (...parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });

export const toKebabCase = (...parts: string[]): string => kebabCase(parts.join(' '));

export const toCamelCase = (...parts: string[]): string =>
	camelCase(parts.join(' '), { transform: camelCaseTransformMerge });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertUnreachable = (_: never): never => {
	throw new Error();
};

export const unresolvedSchemaReferenceError = (): Error =>
	new Error('Unresolved schema reference.');
