import { IConfig } from '@core/config/config.model';
import { FileService } from '@core/file/file.service';
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

describe('cli arguments', () => {
	it('should parse inline arguments correctly', async () => {
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

	it('should parse config correctly', async () => {
		jest.spyOn(FileService.prototype, 'exists').mockReturnValue(true);
		jest.spyOn(FileService.prototype, 'loadJson').mockResolvedValue(correctConfig);

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
