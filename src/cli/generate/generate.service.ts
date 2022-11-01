import fs from 'fs';
import { IAppOptions } from 'src/app.model';
import { Arguments } from 'yargs';
import {
	GenerateCommandOptions,
	IGenerateCommandArgsOptions,
	IGenerateCommandConfigOptions,
} from './generate.model';

export class GenerateCommandService {
	async getOptions(argv: Arguments<GenerateCommandOptions>): Promise<IAppOptions> {
		if (argv.preset) {
			return this.getOptionsFromConfig(argv as Arguments<IGenerateCommandConfigOptions>);
		}

		return this.getOptionsFromArgs(argv as Arguments<IGenerateCommandArgsOptions>);
	}

	private getOptionsFromArgs(argv: Arguments<IGenerateCommandArgsOptions>): IAppOptions {
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
		argv: Arguments<IGenerateCommandConfigOptions>,
	): Promise<IAppOptions> {
		const config = argv.config.trim();

		if (fs.existsSync(config)) {
			throw new Error('Config not found.');
		}

		try {
			const rawData = await fs.promises.readFile(config);

			return JSON.parse(rawData.toString()) as IAppOptions;
		} catch {
			throw new Error('Config file could not be read.');
		}
	}
}
