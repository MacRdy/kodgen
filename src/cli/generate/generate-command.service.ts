import { Arguments } from 'yargs';
import { Config } from '../../core/config/config';
import { IConfig } from '../../core/config/config.model';
import { FileService } from '../../core/file/file.service';
import { LoadService } from '../../core/load/load.service';
import { ParserService } from '../../core/parser/parser.service';
import { Printer } from '../../core/printer/printer';
import { GeneratorService } from '../../generators/generator.service';
import { IGenerateCommandArgs } from './generate-command.model';

export class GenerateCommandService {
	private readonly fileService = new FileService();
	private readonly generatorService = new GeneratorService();
	private readonly loadService = new LoadService();
	private readonly parserService = new ParserService();

	async start(): Promise<void> {
		const config = Config.get();

		Printer.info('Started.');

		Printer.info('OpenAPI definition loading...');

		const rawDefinition = await this.loadService.load(config.input);

		const parser = this.parserService.get(rawDefinition);

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		if (!Config.get().skipValidation) {
			Printer.info('Validation...');

			await parser.validate(rawDefinition);
		}

		Printer.info('Parsing...');

		const spec = await this.parserService.dereference(rawDefinition);

		const document = parser.parse(spec);

		Printer.info('Generator selection...');

		const generator = this.generatorService.get(config.generator);

		Printer.info('Model preparation...');

		const files = generator.generate(document);

		Printer.info('File generation...');

		await this.generatorService.build(generator.getTemplateDir(), files);

		Printer.info('Success.');
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
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
			skipValidation: argv.skipValidation ?? config?.skipValidation,
			templateDir: argv.templateDir?.trim() ?? config?.templateDir,
			templateDataFile: argv.templateDataFile?.trim() ?? config?.templateDataFile,
			skipTemplates: argv.skipTemplates ?? config?.skipTemplates,
			includePaths: argv.includePaths ?? config?.includePaths,
			excludePaths: argv.excludePaths ?? config?.excludePaths,
			hooksFile: argv.hooksFile?.trim() ?? config?.hooksFile,
			verbose: argv.verbose ?? config?.verbose,
		};
	}
}
