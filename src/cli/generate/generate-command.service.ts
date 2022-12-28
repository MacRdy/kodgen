import Ajv from 'ajv';
import { Arguments } from 'yargs';
import generateConfigSchema from '../../../assets/generate-config-schema.json';
import { FileService } from '../../core/file/file.service';
import { LoadService } from '../../core/load/load.service';
import { ParserService } from '../../core/parser/parser.service';
import { Printer } from '../../core/printer/printer';
import { GeneratorService } from '../../generators/generator.service';
import { IGenerateCommandArgs, IGenerateCommandConfig } from './generate-command.model';

export class GenerateCommandService {
	private readonly fileService = new FileService();
	private readonly generatorService = new GeneratorService();
	private readonly loadService = new LoadService();
	private readonly parserService = new ParserService();

	async start(config: IGenerateCommandConfig): Promise<void> {
		Printer.info('Started.');

		Printer.info('OpenAPI definition loading...');

		const rawDefinition = await this.loadService.load(config.input, config);

		const parser = this.parserService.get(rawDefinition);

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		if (!config.skipValidation) {
			Printer.info('Validation...');

			await parser.validate(rawDefinition);
		}

		Printer.info('Parsing...');

		const spec = await this.parserService.dereference(rawDefinition);

		const document = parser.parse(spec, config);

		Printer.info('Generator selection...');

		const generator = this.generatorService.get(config.generator);

		Printer.info('Model preparation...');

		const files = generator.generate(document);

		Printer.info('File generation...');

		await this.generatorService.build(generator.getTemplateDir(), files, config);

		Printer.info('Success.');
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	async getConfig(argv: Arguments<IGenerateCommandArgs>): Promise<IGenerateCommandConfig> {
		let userConfig: IGenerateCommandArgs | undefined;

		if (argv.config) {
			const configPath = argv.config.trim();

			if (configPath && !this.fileService.exists(configPath)) {
				throw new Error('Config not found');
			}

			userConfig = await this.fileService.loadFile<IGenerateCommandArgs>(configPath);
		}

		const config: IGenerateCommandArgs = {
			input: argv.input?.trim() ?? userConfig?.input,
			insecure: argv.insecure ?? userConfig?.insecure,
			generator: argv.generator?.trim() ?? userConfig?.generator,
			output: argv.output?.trim() ?? userConfig?.output,
			clean: argv.clean ?? userConfig?.clean,
			skipValidation: argv.skipValidation ?? userConfig?.skipValidation,
			templateDir: argv.templateDir?.trim() ?? userConfig?.templateDir,
			templateDataFile: argv.templateDataFile?.trim() ?? userConfig?.templateDataFile,
			skipTemplates: argv.skipTemplates ?? userConfig?.skipTemplates,
			includePaths: argv.includePaths ?? userConfig?.includePaths,
			excludePaths: argv.excludePaths ?? userConfig?.excludePaths,
			hooksFile: argv.hooksFile?.trim() ?? userConfig?.hooksFile,
			verbose: argv.verbose ?? userConfig?.verbose,
		};

		const validate = new Ajv({ allErrors: true }).compile<IGenerateCommandConfig>(
			generateConfigSchema,
		);

		if (!validate(config)) {
			const message = validate.errors
				?.map(e => [e.instancePath, e.message].filter(Boolean).join(' '))
				.join('\n- ');

			throw new Error(`Invalid configuration:\n- ${message ?? 'Unknown error'}`);
		}

		return config;
	}
}
