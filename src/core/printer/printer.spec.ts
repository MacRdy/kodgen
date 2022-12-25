import { EOL } from 'os';
import { Config } from '../config/config';
import { Printer } from './printer';

describe('printer', () => {
	it('should call process.stdout.write', () => {
		const writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

		Printer.info('message');

		expect(writeSpy).toHaveBeenCalledWith('message' + EOL);

		writeSpy.mockRestore();
	});

	it('should call process.stdout.write only with verbose=true', () => {
		const writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

		const configGetSpy = jest.spyOn(Config, 'get');

		configGetSpy.mockReturnValueOnce({ generator: '', input: '', output: '', verbose: false });
		configGetSpy.mockReturnValueOnce({ generator: '', input: '', output: '', verbose: true });

		Printer.verbose('message');
		expect(writeSpy).not.toBeCalled();

		Printer.verbose('message');
		expect(writeSpy).toBeCalledTimes(1);

		writeSpy.mockRestore();
		configGetSpy.mockRestore();
	});
});
