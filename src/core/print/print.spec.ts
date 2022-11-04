import { EOL } from 'os';
import { PrintService } from './print.service';

describe('print', () => {
	it('should call process.stdout.write', () => {
		const service = new PrintService();

		const spy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

		service.print('message');

		expect(spy).toHaveBeenCalledWith('message');

		service.println('message');

		expect(spy).toHaveBeenCalledWith('message' + EOL);
	});
});
