import { ErrorObject } from 'ajv';
import { camelCase, camelCaseTransformMerge } from 'camel-case';
import kebabCase from 'just-kebab-case';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { FileService } from './file/file.service';
import { HookFn, IHook } from './hooks/hooks.model';

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
	notFoundMessage?: string,
): Promise<T | undefined> => {
	if (!path) {
		return undefined;
	}

	const fileService = new FileService();

	const configPath = path.trim();

	if (configPath && !fileService.exists(configPath)) {
		throw new Error(notFoundMessage);
	}

	return await fileService.loadFile<T>(configPath);
};

export const loadHooksFile = async (path?: string): Promise<IHook[]> => {
	const hooks: IHook[] = [];

	const hooksObj = await loadFile<Record<string, HookFn>>(path, 'Hooks file not found');

	if (hooksObj) {
		for (const [name, fn] of Object.entries(hooksObj)) {
			hooks.push({ name, fn });
		}
	}

	return hooks;
};
