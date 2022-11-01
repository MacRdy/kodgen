import fs from 'fs';
import { IAppOptions } from 'src/app.model';
import { Arguments } from 'yargs';
import {
	GenerateCommandArgs,
	IGenerateCommandConfigArgs,
	IGenerateCommandInlineArgs,
} from './generate.model';

export class GenerateCommandService {
	async getOptions(argv: Arguments<GenerateCommandArgs>): Promise<IAppOptions> {
		if (argv.config) {
			return this.getOptionsFromConfig(argv as Arguments<IGenerateCommandConfigArgs>);
		}

		return this.getOptionsFromArgs(argv as Arguments<IGenerateCommandInlineArgs>);
	}

	private getOptionsFromArgs(argv: Arguments<IGenerateCommandInlineArgs>): IAppOptions {
		const { generator, input, output, clean, templateFolder } = argv;

		return {
			inputSpec: input.trim(),
			generator: generator.trim(),
			outputPath: output.trim(),
			clean,
			templateFolder: templateFolder?.trim(),
		};
	}

	private async getOptionsFromConfig(
		argv: Arguments<IGenerateCommandConfigArgs>,
	): Promise<IAppOptions> {
		const config = argv.config.trim();

		if (!fs.existsSync(config)) {
			throw new Error('Config not found.');
		}

		try {
			const rawData = await fs.promises.readFile(config);

			const args = JSON.parse(rawData.toString()) as IGenerateCommandInlineArgs;

			return {
				generator: args.generator,
				inputSpec: args.input,
				outputPath: args.output,
				clean: args.clean,
				templateFolder: args.templateFolder,
			};
		} catch {
			throw new Error('Config file could not be read.');
		}
	}
}
