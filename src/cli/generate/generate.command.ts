import { Arguments, BuilderCallback } from 'yargs';
import { AppService } from '../../app.service';
import { GenerateCommandArgs } from './generate-command.model';
import { GenerateCommandService } from './generate-command.service';

export const generateCommandBuilder: BuilderCallback<
	Record<string, never>,
	GenerateCommandArgs
> = yargs =>
	yargs
		.option('config', {
			type: 'string',
			description: 'Config file',
			conflicts: ['generator', 'input', 'output', 'clean', 'templateDir'],
		})
		.option('generator', {
			alias: 'g',
			type: 'string',
			description: 'Generator name',
			implies: ['input', 'output'],
			conflicts: ['config'],
		})
		.option('input', {
			alias: 'i',
			type: 'string',
			description: 'Input spec',
			implies: ['generator'],
			conflicts: ['config'],
		})
		.option('output', {
			alias: 'o',
			type: 'string',
			description: 'Output path',
			implies: ['generator'],
			conflicts: ['config'],
		})
		.option('clean', {
			type: 'boolean',
			description: 'Clean output path',
			implies: ['output'],
			conflicts: ['config'],
		})
		.option('templateDir', {
			alias: 't',
			type: 'string',
			description: 'Custom templates directory',
			implies: ['generator'],
			conflicts: ['config'],
		})
		.option('templateDataFile', {
			type: 'string',
			description: 'Additional template data file',
			implies: ['generator'],
			conflicts: ['config'],
		})
		.option('includePaths', {
			array: true,
			type: 'string',
			description: 'Included paths',
			implies: ['generator'],
			conflicts: ['config', 'excludePaths'],
		})
		.option('excludePaths', {
			array: true,
			type: 'string',
			description: 'Excluded paths',
			implies: ['generator'],
			conflicts: ['config', 'includePaths'],
		})
		.option('hooksFile', {
			type: 'string',
			description: 'Hooks file',
			implies: ['generator'],
			conflicts: ['config'],
		})
		.version(false)
		.strict();

export const generateCommandHandler = async (
	argv: Arguments<GenerateCommandArgs>,
): Promise<void> => {
	const commandService = new GenerateCommandService();
	const appService = new AppService();

	const config = await commandService.getConfig(argv);

	appService.init(config);

	await appService.start();

	process.exit(0);
};
