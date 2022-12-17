import { Arguments } from 'yargs';
import { IConfig } from '../../core/config/config.model';
import { FileService } from '../../core/file/file.service';
import { IGenerateCommandArgs } from './generate-command.model';

export class GenerateCommandService {
	private readonly fileService = new FileService();

	async getConfig(argv: Arguments<IGenerateCommandArgs>): Promise<Partial<IConfig>> {
		let config: IGenerateCommandArgs | undefined;

		if (argv.config) {
			const configPath = argv.config.trim();

			if (configPath && !this.fileService.exists(configPath)) {
				throw new Error('Config not found');
			}

			config = await this.fileService.loadFile<IGenerateCommandArgs>(configPath);
		}

		return {
			input: argv.input?.trim() ?? config?.input,
			insecure: argv.insecure ?? config?.insecure,
			generator: argv.generator?.trim() ?? config?.generator,
			output: argv.output?.trim() ?? config?.output,
			clean: argv.clean ?? config?.clean,
			templateDir: argv.templateDir?.trim() ?? config?.templateDir,
			templateDataFile: argv.templateDataFile?.trim() ?? config?.templateDataFile,
			skipTemplates: argv.skipTemplates ?? config?.skipTemplates,
			includePaths: argv.includePaths ?? config?.includePaths,
			excludePaths: argv.excludePaths ?? config?.excludePaths,
			hooksFile: argv.hooksFile?.trim() ?? config?.hooksFile,
		};
	}
}
