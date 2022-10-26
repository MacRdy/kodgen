import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';

export declare interface Type<T> extends Function {
	new (...args: any[]): T;
}

export const generateModelName = (...parts: string[]): string =>
	pascalCase(parts.join(' '), { transform: pascalCaseTransformMerge });
