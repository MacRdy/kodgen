import { FileService } from '../file/file.service';
import { Hooks } from './hooks';
import { HookFn } from './hooks.model';

jest.mock('../file/file.service');

const globalFileServiceMock = jest.mocked(FileService);

describe('hooks', () => {
	beforeEach(() => {
		globalFileServiceMock.mockClear();
	});

	it('should an error when no instance yet', () => {
		expect(() => Hooks.getOrDefault('', () => undefined)).toThrow();
	});

	it('should initiate hooks correctly', async () => {
		const hookObj: Record<string, HookFn> = {
			foo: () => 'bar',
		};

		jest.mocked(globalFileServiceMock.prototype.loadFile).mockResolvedValueOnce(hookObj);

		await Hooks.init('./file');

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
