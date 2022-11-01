import type { Arguments, BuilderCallback } from 'yargs';
import { AppService } from '../../app.service';
import { PrintService } from '../../core/print.service';

interface IOptions {
	generator: string;
	input: string;
	output: string;
	clean?: boolean;
	templateFolder?: string;
}

export const generateCommandBuilder: BuilderCallback<Record<string, never>, IOptions> = yargs =>
	yargs
		.option('generator', {
			alias: 'g',
			type: 'string',
			description: 'Generator name',
			demandOption: true,
		})
		.option('input', {
			alias: 'i',
			type: 'string',
			description: 'Input spec',
			demandOption: true,
		})
		.option('output', {
			alias: 'o',
			type: 'string',
			description: 'Output path',
			demandOption: true,
		})
		.option('clean', {
			type: 'boolean',
			description: 'Clean output path',
		})
		.option('templateFolder', {
			alias: 't',
			type: 'string',
			description: 'Custom templates folder',
		})
		.version(false)
		.strict();

export const generateCommandHandler = async (argv: Arguments<IOptions>): Promise<void> => {
	const { generator, input, output, clean, templateFolder } = argv;

	const printService = new PrintService();
	const appService = new AppService();

	printService.println('Processing...');

	await appService.start({
		inputSpec: input.trim(),
		generator: generator.trim(),
		outputPath: output.trim(),
		clean,
		templateFolder: templateFolder?.trim(),
	});

	printService.println('Success.');
	process.exit(0);
};
