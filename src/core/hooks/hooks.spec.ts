import { loadFile } from '../utils';
import { Hooks } from './hooks';
import { IHook } from './hooks.model';

jest.mock('../utils');

const loadFileMock = jest.mocked(loadFile);

describe('hooks', () => {
	beforeEach(() => {
		loadFileMock.mockClear();
	});

	it('should an error when no instance yet', () => {
		expect(() => Hooks.getOrDefault('', () => undefined)).toThrow();
	});

	it('should initiate hooks', () => {
		const hooks: IHook[] = [
			{
				name: 'foo',
				fn: () => 'bar',
			},
		];

		Hooks.init(hooks);

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
