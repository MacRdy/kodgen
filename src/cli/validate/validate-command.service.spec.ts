import { Arguments } from 'yargs';
import { loadFile } from '../../core/utils';
import { IValidateCommandArgs, IValidateCommandConfig } from './validate-command.model';
import { ValidateCommandService } from './validate-command.service';

jest.mock('../../core/utils');

const getCommandConfigMock = jest.mocked(loadFile);

const correctConfig: IValidateCommandConfig = {
	input: 'input',
	insecure: true,
};

describe('validate cli command', () => {
	beforeEach(() => {
		getCommandConfigMock.mockClear();
	});

	it('should parse inline arguments correctly', async () => {
		const service = new ValidateCommandService();

		const args: Arguments<IValidateCommandArgs> = {
			$0: '',
			_: [],
			input: ' input ',
			insecure: true,
		};

		const config = await service.getConfig(args);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should parse config correctly', async () => {
		getCommandConfigMock.mockResolvedValueOnce(correctConfig);

		const service = new ValidateCommandService();

		const args: Arguments<Partial<IValidateCommandArgs>> = {
			$0: '',
			_: [],
			config: 'config.json',
		};

		const config = await service.getConfig(args as Arguments<IValidateCommandArgs>);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should override config parameters', async () => {
		getCommandConfigMock.mockResolvedValueOnce(correctConfig);

		const service = new ValidateCommandService();

		const args: Arguments<Partial<IValidateCommandArgs>> = {
			$0: '',
			_: [],
			config: 'config.json',
			input: 'inputOverride',
		};

		const config = await service.getConfig(args as Arguments<IValidateCommandArgs>);

		expect(config).toStrictEqual({ ...correctConfig, input: 'inputOverride' });
	});
});
