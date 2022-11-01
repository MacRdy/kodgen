import type { Arguments, BuilderCallback } from 'yargs';
import { AppService } from '../../app.service';
import { GenerateCommandArgs } from './generate.model';
import { GenerateCommandService } from './generate.service';

export const generateCommandBuilder: BuilderCallback<
	Record<string, never>,
	GenerateCommandArgs
> = yargs =>
	yargs
		.option('config', {
			type: 'string',
			description: 'Config file',
			conflicts: ['generator', 'input', 'output', 'clean', 'templateFolder'],
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
		.option('templateFolder', {
			alias: 't',
			type: 'string',
			description: 'Custom templates folder',
			implies: ['generator'],
			conflicts: ['config'],
		})
		.version(false)
		.strict();

export const generateCommandHandler = async (
	argv: Arguments<GenerateCommandArgs>,
): Promise<void> => {
	const cliService = new GenerateCommandService();
	const appService = new AppService();

	const options = await cliService.getOptions(argv);

	await appService.start(options);

	process.exit(0);
};
