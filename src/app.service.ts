import { Config } from './core/config/config';
import { IConfig } from './core/config/config.model';
import { FileService } from './core/file/file.service';
import { Hooks } from './core/hooks/hooks';
import { HookFn } from './core/hooks/hooks.model';
import { ParserService } from './core/parser/parser.service';
import { Printer } from './core/print/printer';
import { GeneratorService } from './generators/generator.service';

export class AppService {
	private readonly generatorService = new GeneratorService();
	private readonly parser = new ParserService();
	private readonly fileService = new FileService();

	async start(): Promise<void> {
		const config = Config.get();

		Printer.info('Started.');

		const doc = await this.parser.parse(config.input);

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

		const hooks = config.hooksFile
			? await this.fileService.loadJs<Record<string, HookFn>>(config.hooksFile)
			: undefined;

		Hooks.init(hooks);
	}
}
