import { Arguments } from 'yargs';
import { IConfig } from '../../core/config/config.model';
import { FileService } from '../../core/file/file.service';
import { IGenerateCommandConfigArgs, IGenerateCommandInlineArgs } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

jest.mock('../../core/file/file.service');

const fileServiceMock = jest.mocked(FileService);

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
	skipTemplates: ['tpl-1'],
	insecure: true,
};

describe('cli arguments', () => {
	beforeEach(() => {
		fileServiceMock.mockClear();
	});

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
			skipTemplates: ['tpl-1'],
			insecure: true,
		};

		const config = await service.getConfig(args);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should parse config correctly', async () => {
		const service = new GenerateCommandService();

		jest.mocked(fileServiceMock.mock.instances[0])?.exists.mockReturnValue(true);
		jest.mocked(fileServiceMock.mock.instances[0])?.loadJson.mockResolvedValue(correctConfig);

		const args: Arguments<IGenerateCommandConfigArgs> = {
			$0: '',
			_: [],
			config: 'config.json',
		};

		const config = await service.getConfig(args);

		expect(config).toStrictEqual(correctConfig);
	});
});
