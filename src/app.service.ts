import { Config } from './core/config/config';
import { IConfig } from './core/config/config.model';
import { Hooks } from './core/hooks/hooks';
import { LoadService } from './core/load/load.service';
import { ParserService } from './core/parser/parser.service';
import { Printer } from './core/printer/printer';
import { GeneratorService } from './generators/generator.service';

export class AppService {
	private readonly generatorService = new GeneratorService();
	private readonly loadService = new LoadService();
	private readonly parserService = new ParserService();

	async start(): Promise<void> {
		const config = Config.get();

		Printer.info('Started.');

		Printer.info('OpenAPI definition loading...');

		const definition = await this.loadService.load(config.input);

		const parser = this.parserService.get(definition);

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		Printer.info('Validation...');

		await parser.validate(definition);

		Printer.info('Parsing...');

		const document = await parser.parse(definition);

		Printer.info('Generator selection...');

		const generator = this.generatorService.get(config.generator);

		Printer.info('Model preparation...');

		const files = generator.generate(document);

		Printer.info('File generation...');

		await this.generatorService.build(generator.getTemplateDir(), files);

		Printer.info('Success.');
	}

	async init(config: IConfig): Promise<void> {
		Config.init(config);

		await Hooks.init(config.hooksFile);
	}
}
