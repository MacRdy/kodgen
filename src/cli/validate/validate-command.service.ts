import Ajv from 'ajv';
import { Arguments } from 'yargs';
import validateConfigSchema from '../../../assets/validate-config-schema.json';
import { LoadService } from '../../core/load/load.service';
import { ParserService } from '../../core/parser/parser.service';
import { Printer } from '../../core/printer/printer';
import { getAjvValidateErrorMessage, loadFile } from '../../core/utils';
import { IValidateCommandArgs, IValidateCommandConfig } from './validate-command.model';

export class ValidateCommandService {
	private readonly loadService = new LoadService();
	private readonly parserService = new ParserService();

	async start(config: IValidateCommandConfig): Promise<void> {
		Printer.info('Started.');

		Printer.info('OpenAPI definition loading...');

		const rawDefinition = await this.loadService.load(config.input, config);

		const parser = this.parserService.get(rawDefinition);

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		Printer.info('Validation...');

		await parser.validate(rawDefinition);

		Printer.info('Success.');
	}

	async getConfig(argv: Arguments<IValidateCommandArgs>): Promise<IValidateCommandConfig> {
		const userConfig = await loadFile<IValidateCommandArgs>(argv.config, 'Config not found');

		const config: IValidateCommandArgs = {
			input: argv.input?.trim() ?? userConfig?.input,
			insecure: argv.insecure ?? userConfig?.insecure,
		};

		const validate = new Ajv({ allErrors: true }).compile<IValidateCommandConfig>(
			validateConfigSchema,
		);

		if (!validate(config)) {
			throw new Error(
				getAjvValidateErrorMessage(validate.errors, 'Invalid command configuration'),
			);
		}

		return config;
	}
}
