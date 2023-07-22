import { EOL } from 'os';
import { Printer } from './printer';
import { PrinterLevel } from './printer.model';

describe('printer', () => {
	it('should print info level message', () => {
		const writeSpy = jest.spyOn(process.stdout, 'write');
		writeSpy.mockReturnValue(true);

		Printer.info('message');

		expect(writeSpy).toHaveBeenCalledWith('\x1b[1m\x1b[34mmessage\x1b[0m' + EOL);

		writeSpy.mockRestore();
	});

	it('should print warn level message', () => {
		const writeSpy = jest.spyOn(process.stdout, 'write');
		writeSpy.mockReturnValue(true);

		Printer.warn('message');

		expect(writeSpy).toHaveBeenCalledWith('\x1b[33mmessage\x1b[0m' + EOL);

		writeSpy.mockRestore();
	});

	it('should call process.stdout.write only with verbose=true', () => {
		const writeSpy = jest.spyOn(process.stdout, 'write');
		writeSpy.mockReturnValue(true);

		Printer.verbose('message');
		expect(writeSpy).not.toBeCalled();

		Printer.setLevel(PrinterLevel.Verbose);

		Printer.verbose('message');
		expect(writeSpy).toHaveBeenCalledWith('\x1b[36mmessage\x1b[0m' + EOL);

		Printer.setLevel(PrinterLevel.Info);

		writeSpy.mockRestore();
	});
});
