import type { Arguments, BuilderCallback } from 'yargs';

type Options = {
	name: string;
	upper: boolean | undefined;
};

export const generateCommandBuilder: BuilderCallback<Record<string, never>, Options> = yargs =>
	yargs.options({
		upper: { type: 'boolean' },
	});

export const generateCommandHandler = (argv: Arguments<Options>): void => {
	const { upper } = argv;
	console.log(argv);

	const greeting = `Hello, aaa!`;
	process.stdout.write(upper ? greeting.toUpperCase() : greeting);
	process.exit(0);
};
