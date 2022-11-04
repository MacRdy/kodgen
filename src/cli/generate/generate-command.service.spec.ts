import { IConfig } from '@core/config/config.model';
import { FileService } from '@core/file.service';
import { Arguments } from 'yargs';
import { IGenerateCommandConfigArgs, IGenerateCommandInlineArgs } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

const correctConfig: IConfig = {
	generator: 'generator-name',
	input: 'input',
	output: 'output',
	clean: true,
	includePaths: ['^/Files'],
	excludePaths: ['^/Data'],
	hooksFile: './hooks.js',
	templateDir: './custom-templates',
	templateDataFile: './custom-template-data.json',
};

jest.mock('@core/file.service', () => ({
	FileService: jest.fn<Partial<FileService>, []>().mockImplementation(() => ({
		exists: jest.fn().mockReturnValue(true),
		loadJson: jest.fn().mockResolvedValue(correctConfig),
	})),
}));

describe('cli arguments', () => {
	test('should parse inline arguments correctly', async () => {
		const service = new GenerateCommandService();

		const args: Arguments<IGenerateCommandInlineArgs> = {
			$0: '',
			_: [],
			generator: '  generator-name ',
			input: ' input ',
			output: ' output ',
			clean: true,
			includePaths: ['^/Files'],
			excludePaths: ['^/Data'],
			hooksFile: ' ./hooks.js ',
			templateDir: ' ./custom-templates ',
			templateDataFile: ' ./custom-template-data.json ',
		};

		const config = await service.getConfig(args);

		expect(config).toEqual(correctConfig);
	});

	test('should parse config correctly', async () => {
		const service = new GenerateCommandService();

		const args: Arguments<IGenerateCommandConfigArgs> = {
			$0: '',
			_: [],
			config: 'config.json',
		};

		const config = await service.getConfig(args);

		expect(config).toEqual(correctConfig);
	});
});
