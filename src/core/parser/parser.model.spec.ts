import { Printer } from '../printer/printer';
import {
	getExtensions,
	getOriginalOrCurrent,
	isOpenApiReferenceObject,
	prepareOriginalReferences,
	schemaWarning,
	TrivialError,
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
		const warnSpy = jest.spyOn(Printer, 'warn');

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

		schemaWarning(['scope'], new TrivialError('Error'));
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

	it('should return original object if exists', () => {
		const original = { original: true };

		const a = {
			__KODGEN_ORIGINAL_REF_MODEL: original,
			original: false,
		};

		const b = { original: false };

		expect(getOriginalOrCurrent(a)).toBe(original);

		expect(getOriginalOrCurrent(b)).toBe(b);
	});

	it('should make additional original references', () => {
		const a = {
			$ref: 'ref',
			test: { x: 1, $ref: 'ref1' },
			test1: [{ x: 2, $ref: 'ref2', test2: { $ref: 'ref3' } }],
		};

		prepareOriginalReferences(a);

		expect(a).toStrictEqual({
			__KODGEN_ORIGINAL_REF_MODEL: { $ref: 'ref' },
			$ref: 'ref',
			test: { x: 1, $ref: 'ref1', __KODGEN_ORIGINAL_REF_MODEL: { $ref: 'ref1' } },
			test1: [
				{
					x: 2,
					$ref: 'ref2',
					__KODGEN_ORIGINAL_REF_MODEL: { $ref: 'ref2' },
					test2: { $ref: 'ref3', __KODGEN_ORIGINAL_REF_MODEL: { $ref: 'ref3' } },
				},
			],
		});
	});
});
