import { Printer } from '../printer/printer';
import {
	getExtensions,
	isOpenApiReferenceObject,
	schemaWarning,
	UnknownTypeError,
	UnresolvedReferenceError,
} from './parser.model';

describe('parser-model', () => {
	it('should detect reference object', () => {
		expect(isOpenApiReferenceObject({ $ref: '' })).toBe(true);
		expect(isOpenApiReferenceObject({ prop: '' })).toBe(false);
	});

	it('should take vendor extensions from object', () => {
		const obj = { prop: 'test', 'x-prop': true, 'x-prop1': 0 };

		expect(getExtensions(obj)).toStrictEqual({ 'x-prop': true, 'x-prop1': 0 });
	});

	it('should print warning with message', () => {
		const warnSpy = jest.spyOn(Printer, 'warn').mockImplementation(jest.fn());

		schemaWarning(['scope', '', undefined, 'scope1'], new Error());
		expect(warnSpy).toHaveBeenCalledWith('Warning (scope scope1): Unsupported schema');
		warnSpy.mockReset();

		schemaWarning(['Error'], new Error(), 'Default message');
		expect(warnSpy).toHaveBeenCalledWith('Warning (Error): Default message');
		warnSpy.mockReset();

		schemaWarning(['scope'], new UnresolvedReferenceError(''));
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockReset();

		schemaWarning(['scope'], new UnknownTypeError());
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockReset();

		schemaWarning(['scope'], null);
		expect(warnSpy).toHaveBeenCalledWith('Warning (scope): Unsupported schema');
		warnSpy.mockReset();

		schemaWarning(['scope'], 'Test');
		expect(warnSpy).toHaveBeenCalledWith('Warning (scope): Test');
		warnSpy.mockReset();

		warnSpy.mockRestore();
	});
});
