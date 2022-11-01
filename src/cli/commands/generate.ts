import type { Arguments, BuilderCallback } from 'yargs';

type Options = {
	name: string;
	upper: boolean | undefined;
};

export const generateCommandBuilder: BuilderCallback<Record<string, never>, Options> = yargs =>
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

export const generateCommandHandler = (argv: Arguments<Options>): void => {
	const { upper } = argv;
	console.log(argv);

	const greeting = `Hello, aaa!`;
	process.stdout.write(upper ? greeting.toUpperCase() : greeting);
	process.exit(0);
};
