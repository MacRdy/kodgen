import { Printer } from '../printer/printer';
import {
	DefaultError,
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

		schemaWarning(new DefaultError('Unsupported schema', ['scope', '', undefined, 'scope1']));
		expect(warnSpy).toHaveBeenCalledWith('Warning: Unsupported schema (scope scope1)');
		warnSpy.mockReset();

		schemaWarning(new DefaultError('Default message', ['Error']));
		expect(warnSpy).toHaveBeenCalledWith('Warning: Default message (Error)');
		warnSpy.mockReset();

		schemaWarning(new UnresolvedReferenceError(''));
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockReset();

		schemaWarning(new UnknownTypeError(['scope']));
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockReset();

		warnSpy.mockRestore();
	});
});
