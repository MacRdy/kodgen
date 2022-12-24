import { EOL } from 'os';
import { Printer } from './printer';

describe('printer', () => {
	it('should call process.stdout.write', () => {
		const spy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

		Printer.info('message');

		expect(spy).toHaveBeenCalledWith('message' + EOL);

		spy.mockRestore();
	});
});
