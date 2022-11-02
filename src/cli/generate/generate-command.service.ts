import fs from 'fs';
import { Arguments } from 'yargs';
import { IConfig } from '../../core/config/config.model';
import { FileService } from '../../core/file.service';
import {
	GenerateCommandArgs,
	IGenerateCommandConfigArgs,
	IGenerateCommandInlineArgs,
} from './generate-command.model';

export class GenerateCommandService {
	private readonly fileService = new FileService();

	async getConfig(argv: Arguments<GenerateCommandArgs>): Promise<IConfig> {
		if (argv.config) {
			return this.getConfigFromFile(argv as Arguments<IGenerateCommandConfigArgs>);
		}

		return this.getConfigFromArgs(argv as Arguments<IGenerateCommandInlineArgs>);
	}

	private getConfigFromArgs(argv: Arguments<IGenerateCommandInlineArgs>): IConfig {
		const { generator, input, output, clean, templateDir, excludePaths, includePaths } = argv;

		return {
			input: input.trim(),
			generator: generator.trim(),
			output: output.trim(),
			clean,
			templateDir: templateDir?.trim(),
			includePaths: includePaths,
			excludePaths: excludePaths,
		};
	}

	private async getConfigFromFile(argv: Arguments<IGenerateCommandConfigArgs>): Promise<IConfig> {
		const config = argv.config.trim();

		if (!fs.existsSync(config)) {
			throw new Error('Config not found.');
		}

		try {
			const rawData = await this.fileService.readFile(config);

			const args = JSON.parse(rawData.toString('utf-8')) as IGenerateCommandInlineArgs;

			return {
				generator: args.generator,
				input: args.input,
				output: args.output,
				clean: args.clean,
				templateDir: args.templateDir,
				includePaths: args.includePaths,
				excludePaths: args.excludePaths,
			};
		} catch {
			throw new Error('Config file could not be read.');
		}
	}
}
