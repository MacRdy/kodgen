import { ErrorObject } from 'ajv';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assertUnreachable = (_: never): never => {
	throw new Error();
};

export const generateAjvErrorMessage = (title: string, errors?: ErrorObject[] | null): string => {
	const message = errors
		?.map(e => [e.instancePath, e.message].filter(Boolean).join(' '))
		.join('\n- ');

	return message ? `${title}\n- ${message}` : title;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export interface Type<T> extends Function {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	new (...args: any[]): T;
}
