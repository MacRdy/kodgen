import {
	DEREFERENCE_RESOLVED_VALUE,
	getDereferenceResolvedValueOrDefault,
} from './dereference.model';

describe('dereference-model', () => {
	it('should get resolved value if exists', () => {
		const value = {};

		const objWithValue = { [DEREFERENCE_RESOLVED_VALUE]: value };
		const objWithoutValue = {};

		expect(getDereferenceResolvedValueOrDefault(objWithValue)).toBe(value);
		expect(getDereferenceResolvedValueOrDefault(objWithoutValue)).toBe(objWithoutValue);
	});
});
