import { Arguments, BuilderCallback } from 'yargs';
import { AppService } from '../../app.service';
import { IConfig } from '../../core/config/config.model';
import { IGenerateCommandArgs } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

export const generateCommandBuilder: BuilderCallback<
	Record<string, never>,
	IGenerateCommandArgs
> = yargs =>
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

export const generateCommandHandler = async (
	argv: Arguments<IGenerateCommandArgs>,
): Promise<void> => {
	const commandService = new GenerateCommandService();
	const appService = new AppService();

	const config = await commandService.getConfig(argv);

	await appService.init(config as IConfig);
	await appService.start();

	process.exit(0);
};
