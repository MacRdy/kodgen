#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { generateCommandModule } from './generate/generate.command';
import { handleError } from './handle-error';
import { validateCommandModule } from './validate/validate.command';

void yargs(hideBin(process.argv))
	.scriptName('kodgen')
	.command<any>(generateCommandModule)
	.command<any>(validateCommandModule)
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
	.showHelpOnFail(false)
	.locale('en-US')
	.fail(handleError).argv;
