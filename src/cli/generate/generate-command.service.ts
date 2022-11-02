import fs from 'fs';
import { Arguments } from 'yargs';
import { IConfig } from '../../core/config/config.model';
import {
	GenerateCommandArgs,
	IGenerateCommandConfigArgs,
	IGenerateCommandInlineArgs,
} from './generate-command.model';

export class GenerateCommandService {
	async getConfig(argv: Arguments<GenerateCommandArgs>): Promise<IConfig> {
		if (argv.config) {
			return this.getConfigFromFile(argv as Arguments<IGenerateCommandConfigArgs>);
		}

		return this.getConfigFromArgs(argv as Arguments<IGenerateCommandInlineArgs>);
	}

	private getConfigFromArgs(argv: Arguments<IGenerateCommandInlineArgs>): IConfig {
		const { generator, input, output, clean, templateDir } = argv;

		return {
			input: input.trim(),
			generator: generator.trim(),
			output: output.trim(),
			clean,
			templateDir: templateDir?.trim(),
		};
	}

	private async getConfigFromFile(argv: Arguments<IGenerateCommandConfigArgs>): Promise<IConfig> {
		const config = argv.config.trim();

		if (!fs.existsSync(config)) {
			throw new Error('Config not found.');
		}

		try {
			const rawData = await fs.promises.readFile(config);

			const args = JSON.parse(rawData.toString()) as IGenerateCommandInlineArgs;

			return {
				generator: args.generator,
				input: args.input,
				output: args.output,
				clean: args.clean,
				templateDir: args.templateDir,
			};
		} catch {
			throw new Error('Config file could not be read.');
		}
	}
}
