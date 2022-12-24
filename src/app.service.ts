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

		const buffer = await this.loadService.load(config.input);

		Printer.info('Parsing...');

		const resource = buffer.toString('utf-8');
		const doc = await this.parserService.parse(resource);

		Printer.info('Check generator...');

		const generator = this.generatorService.get(config.generator);

		Printer.info('Prepare models...');

		const files = generator.generate(doc);

		Printer.info('Files generation...');

		await this.generatorService.build(generator.getTemplateDir(), files);

		Printer.info('Success.');
	}

	async init(config: IConfig): Promise<void> {
		Config.init(config);

		await Hooks.init(config.hooksFile);
	}
}
