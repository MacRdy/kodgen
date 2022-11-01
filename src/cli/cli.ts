#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateCommandBuilder, generateCommandHandler } from './commands/generate';
import { handleError } from './handle-error';

void yargs(hideBin(process.argv))
	.scriptName('kodgen')
	.command('generate', 'Start generation process', generateCommandBuilder, generateCommandHandler)
	.command(
		'$0',
		'Kodgen CLI usage',
		() => undefined,
		() => {
			yargs.showHelp();
		},
	)
	.strict()
	.alias({ h: 'help' })
	.fail(handleError).argv;
