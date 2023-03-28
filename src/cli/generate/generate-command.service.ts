import Ajv from 'ajv';
import { OpenAPI } from 'openapi-types';
import { Arguments } from 'yargs';
import generateConfigSchema from '../../../assets/generate-config-schema.json';
import { DereferenceService } from '../../core/dereference/dereference.service';
import { LoadService } from '../../core/load/load.service';
import { ParserService } from '../../core/parser/parser.service';
import { Printer } from '../../core/printer/printer';
import { getAjvValidateErrorMessage, loadFile } from '../../core/utils';
import { GeneratorService } from '../../generators/generator.service';
import { IGenerateCommandArgs, IGenerateCommandConfig } from './generate-command.model';

export class GenerateCommandService {
	private readonly generatorService = new GeneratorService();
	private readonly parserService = new ParserService();

	async start(config: IGenerateCommandConfig): Promise<void> {
		Printer.info('Started.');

		Printer.info('OpenAPI definition loading...');

		const loadService = new LoadService(config);
		const dereferenceService = new DereferenceService(loadService);

		const spec = await loadService.load<OpenAPI.Document>(config.input);

		const parser = this.parserService.get(spec);

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		if (!config.skipValidation) {
			Printer.info('Validation...');

			await parser.validate(spec);
		}

		Printer.info('Parsing...');

		await dereferenceService.dereference(spec, config.input);

		const document = parser.parse(spec, config);

		Printer.info('Generator selection...');

		const generator = this.generatorService.get(config.generator);

		Printer.info('Model preparation...');

		const generatorConfig = generator.prepareConfig?.(config.generatorConfig);

		const files = generator.generate(document, generatorConfig);

		Printer.info('File generation...');

		await this.generatorService.build(generator.getTemplateDir(), files, config);

		Printer.info('Success.');
	}

	// eslint-disable-next-line sonarjs/cognitive-complexity
	async getConfig(argv: Arguments<IGenerateCommandArgs>): Promise<IGenerateCommandConfig> {
		const userConfig = await loadFile<IGenerateCommandArgs>(argv.config, 'Config not found');

		const config: IGenerateCommandArgs = {
			input: argv.input?.trim() ?? this.normalizePath(userConfig?.input, argv.config),
			insecure: argv.insecure ?? userConfig?.insecure,
			generator: argv.generator?.trim() ?? userConfig?.generator,
			generatorConfigFile:
				argv.generatorConfigFile?.trim() ??
				this.normalizePath(userConfig?.generatorConfigFile, argv.config),
			output: argv.output?.trim() ?? this.normalizePath(userConfig?.output, argv.config),
			clean: argv.clean ?? userConfig?.clean,
			skipValidation: argv.skipValidation ?? userConfig?.skipValidation,
			templateDir:
				argv.templateDir?.trim() ??
				this.normalizePath(userConfig?.templateDir, argv.config),
			templateDataFile:
				argv.templateDataFile?.trim() ??
				this.normalizePath(userConfig?.templateDataFile, argv.config),
			skipTemplates: argv.skipTemplates ?? userConfig?.skipTemplates,
			includePaths: argv.includePaths ?? userConfig?.includePaths,
			excludePaths: argv.excludePaths ?? userConfig?.excludePaths,
			hooksFile:
				argv.hooksFile?.trim() ?? this.normalizePath(userConfig?.hooksFile, argv.config),
			verbose: argv.verbose ?? userConfig?.verbose,
		};

		const validate = new Ajv({ allErrors: true }).compile<IGenerateCommandConfig>(
			generateConfigSchema,
		);

		if (!validate(config)) {
			throw new Error(
				getAjvValidateErrorMessage(validate.errors, 'Invalid command configuration'),
			);
		}

		if (config.generatorConfigFile) {
			config.generatorConfig = await loadFile(
				config.generatorConfigFile,
				'Generator config not found',
			);
		}

		return config;
	}

	private normalizePath(path?: string, configPath?: string): string | undefined {
		const loadService = new LoadService();

		if (!path) {
			return undefined;
		}

		return loadService.normalizePath(path, configPath);
	}
}
