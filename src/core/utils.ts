import { ErrorObject } from 'ajv';
import { camelCase, camelCaseTransformMerge } from 'camel-case';
import kebabCase from 'just-kebab-case';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { FileService } from './file/file.service';

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

export const getAjvValidateErrorMessage = (
	errors?: ErrorObject[] | null,
	title = 'Invalid configuration',
): string => {
	const message = errors
		?.map(e => [e.instancePath, e.message].filter(Boolean).join(' '))
		.join('\n- ');

	return `${title}:\n- ${message ?? 'Unknown error'}`;
};

export const loadFile = async <T>(
	path?: string,
	errorMessage = 'Config not found',
): Promise<T | undefined> => {
	// TOOD tests errorMessage. jest.mock names
	let content: T | undefined;

	if (path) {
		const fileService = new FileService();

		const configPath = path.trim();

		if (configPath && !fileService.exists(configPath)) {
			throw new Error(errorMessage);
		}

		content = await fileService.loadFile<T>(configPath);
	}

	return content;
};
