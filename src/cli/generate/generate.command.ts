import { Arguments, CommandBuilder, CommandModule } from 'yargs';
import { Hooks } from '../../core/hooks/hooks';
import { Printer } from '../../core/printer/printer';
import { IGenerateCommandArgs } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

const generateCommandBuilder: CommandBuilder<Record<string, never>, IGenerateCommandArgs> = yargs =>
	yargs
		.option('config', {
			type: 'string',
			description: 'Config file',
		})
		.option('generator', {
			alias: 'g',
			type: 'string',
			description: 'Generator name',
		})
		.option('input', {
			alias: 'i',
			type: 'string',
			description: 'Input spec',
		})
		.option('insecure', {
			type: 'boolean',
			description: 'Insecure HTTPS connection',
		})
		.option('skipValidation', {
			type: 'boolean',
			description: 'Skip spec validation process',
		})
		.option('output', {
			alias: 'o',
			type: 'string',
			description: 'Output path',
		})
		.option('clean', {
			type: 'boolean',
			description: 'Clean output path',
		})
		.option('templateDir', {
			alias: 't',
			type: 'string',
			description: 'Custom templates directory',
		})
		.option('templateDataFile', {
			type: 'string',
			description: 'Additional template data file',
		})
		.option('skipTemplates', {
			array: true,
			type: 'string',
			description: 'Skip specific templates when generating',
		})
		.option('includePaths', {
			array: true,
			type: 'string',
			description: 'Include specific url patterns (regex strings)',
			conflicts: ['excludePaths'],
		})
		.option('excludePaths', {
			array: true,
			type: 'string',
			description: 'Exclude specific url patterns (regex strings)',
			conflicts: ['includePaths'],
		})
		.option('hooksFile', {
			type: 'string',
			description: 'Hooks file',
		})
		.option('verbose', {
			type: 'boolean',
			description: 'Increased level of logging',
		})
		.version(false)
		.strict();

const generateCommandHandler = async (argv: Arguments<IGenerateCommandArgs>): Promise<void> => {
	const commandService = new GenerateCommandService();

	const config = await commandService.getConfig(argv);

	if (config.verbose) {
		Printer.setLevel('verbose');
	}

	await Hooks.init(config.hooksFile);

	await commandService.start(config);

	process.exit(0);
};

export const generateCommandModule: CommandModule<Record<string, never>, IGenerateCommandArgs> = {
	command: 'generate',
	describe: 'Run generation process',
	builder: generateCommandBuilder,
	handler: generateCommandHandler,
};
