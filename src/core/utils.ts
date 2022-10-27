import camelCase from 'camelcase';
import kebabCase from 'just-kebab-case';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';

export declare interface Type<T> extends Function {
	new (...args: any[]): T;
}

export const toPascalCase = (...parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });

export const toKebabCase = (...parts: string[]): string => kebabCase(parts.join(' '));

export const toCamelCase = (...parts: string[]): string => camelCase(parts.join(' '));
