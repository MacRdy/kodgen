import { IConfig } from '@core/config/config.model';
import { FileService } from '@core/file/file.service';
import Ajv from 'ajv';
import { Arguments } from 'yargs';
import configSchema from '../../../assets/config-schema.json';
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
		const {
			generator,
			input,
			output,
			clean,
			templateDir,
			templateDataFile,
			skipTemplates,
			excludePaths,
			includePaths,
			hooksFile,
		} = argv;

		return {
			input: input.trim(),
			generator: generator.trim(),
			output: output.trim(),
			clean,
			templateDir: templateDir?.trim(),
			templateDataFile: templateDataFile?.trim(),
			skipTemplates,
			includePaths,
			excludePaths,
			hooksFile: hooksFile?.trim(),
		};
	}

	private async getConfigFromFile(argv: Arguments<IGenerateCommandConfigArgs>): Promise<IConfig> {
		const config = argv.config.trim();

		if (!this.fileService.exists(config)) {
			throw new Error('Config not found.');
		}

		const args = await this.fileService.loadJson<IGenerateCommandInlineArgs>(config);

		this.validate(args);

		return {
			generator: args.generator,
			input: args.input,
			output: args.output,
			clean: args.clean,
			templateDir: args.templateDir,
			templateDataFile: args.templateDataFile,
			skipTemplates: args.skipTemplates,
			includePaths: args.includePaths,
			excludePaths: args.excludePaths,
			hooksFile: args.hooksFile,
		};
	}

	private validate(data: IGenerateCommandInlineArgs): void {
		const validate = new Ajv({ allErrors: true }).compile<IGenerateCommandInlineArgs>(
			configSchema,
		);

		if (!validate(data)) {
			const message = validate.errors
				?.map(e => [e.instancePath, e.message].filter(Boolean).join(' '))
				.join('\n- ');

			throw new Error(`Invalid configuration:\n- ${message ?? 'Unknown error'}`);
		}
	}
}
