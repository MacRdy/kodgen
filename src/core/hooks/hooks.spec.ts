import { Hooks } from './hooks';
import { HookFn } from './hooks.model';

describe('hooks', () => {
	it('should an error when no instance yet', () => {
		expect(() => Hooks.getOrDefault('', () => undefined)).toThrow();
	});

	it('should initiate hooks correctly', () => {
		const hookObj: Record<string, HookFn> = {
			foo: () => 'bar',
		};

		Hooks.init(hookObj);

		const fn = Hooks.getOrDefault('foo', () => 'baz');

		expect(fn()).toStrictEqual('bar');

		const fn1 = Hooks.getOrDefault('', () => 'baz');

		expect(fn1()).toStrictEqual('baz');
	});

	it('should reset instance', () => {
		Hooks.reset();

		expect(() => Hooks.getOrDefault('', () => undefined)).toThrow();
	});
});
