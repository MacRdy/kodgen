import { Arguments } from 'yargs';
import { loadFile } from '../../core/utils';
import { IGenerateCommandArgs, IGenerateCommandConfig } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

jest.mock('../../core/utils');

const loadFileMock = jest.mocked(loadFile);

const correctConfig: IGenerateCommandConfig = {
	generator: 'generator-name',
	generatorConfigFile: undefined,
	input: 'input',
	output: 'output',
	clean: true,
	skipValidation: true,
	includePaths: ['^/Files'],
	excludePaths: ['^/Data'],
	hooksFile: './hooks.js',
	templateDir: './custom-templates',
	templateDataFile: './custom-template-data.json',
	skipTemplates: ['tpl-1'],
	insecure: true,
	verbose: true,
};

describe('generate cli command', () => {
	beforeEach(() => {
		loadFileMock.mockClear();
	});

	it('should parse inline arguments correctly', async () => {
		const service = new GenerateCommandService();

		const args: Arguments<IGenerateCommandArgs> = {
			$0: '',
			_: [],
			generator: '  generator-name ',
			input: ' input ',
			output: ' output ',
			clean: true,
			skipValidation: true,
			includePaths: ['^/Files'],
			excludePaths: ['^/Data'],
			hooksFile: ' ./hooks.js ',
			templateDir: ' ./custom-templates ',
			templateDataFile: ' ./custom-template-data.json ',
			skipTemplates: ['tpl-1'],
			insecure: true,
			verbose: true,
		};

		const config = await service.getConfig(args);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should parse config correctly', async () => {
		loadFileMock.mockResolvedValueOnce(correctConfig);

		const service = new GenerateCommandService();

		const args: Arguments<Partial<IGenerateCommandArgs>> = {
			$0: '',
			_: [],
			config: 'config.json',
		};

		const config = await service.getConfig(args as Arguments<IGenerateCommandArgs>);

		expect(config).toStrictEqual(correctConfig);
	});

	it('should override config parameters', async () => {
		loadFileMock.mockResolvedValueOnce(correctConfig);

		const service = new GenerateCommandService();

		const args: Arguments<Partial<IGenerateCommandArgs>> = {
			$0: '',
			_: [],
			config: 'config.json',
			input: 'inputOverride',
		};

		const config = await service.getConfig(args as Arguments<IGenerateCommandArgs>);

		expect(config).toStrictEqual({ ...correctConfig, input: 'inputOverride' });
	});

	it('should load generator config', async () => {
		loadFileMock.mockResolvedValueOnce(undefined);
		loadFileMock.mockResolvedValueOnce({ var: true });

		const service = new GenerateCommandService();

		const args: Arguments<IGenerateCommandArgs> = {
			$0: '',
			_: [],
			generator: 'generator',
			generatorConfigFile: 'generatorConfigFile',
			input: 'input',
			output: 'output',
		};

		const config = await service.getConfig(args);

		expect<IGenerateCommandConfig>(config).toStrictEqual({
			generator: 'generator',
			generatorConfigFile: 'generatorConfigFile',
			generatorConfig: { var: true },
			input: 'input',
			output: 'output',
			clean: undefined,
			includePaths: undefined,
			excludePaths: undefined,
			hooksFile: undefined,
			insecure: undefined,
			skipTemplates: undefined,
			skipValidation: undefined,
			templateDataFile: undefined,
			templateDir: undefined,
			verbose: undefined,
		});
	});
});
