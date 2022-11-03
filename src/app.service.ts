import { Config } from './core/config/config';
import { IConfig } from './core/config/config.model';
import { FileService } from './core/file.service';
import { Hooks } from './core/hooks/hooks';
import { HookFn } from './core/hooks/hooks.model';
import { ParserService } from './core/parser/parser.service';
import { PrintService } from './core/print.service';
import { GeneratorService } from './generators/generator.service';

export class AppService {
	private readonly generatorService = new GeneratorService();
	private readonly parser = new ParserService();
	private readonly printService = new PrintService();
	private readonly fileService = new FileService();

	async start(): Promise<void> {
		const config = Config.get();

		this.printService.println('Started.');

		const doc = await this.parser.parse(config.input);

		this.printService.println('Check generator...');

		const generator = this.generatorService.get(config.generator);

		this.printService.println('Files generation...');

		const files = generator.generate(doc);

		await this.generatorService.build(
			config.output,
			!!config.clean,
			generator.getTemplateDir(),
			files,
		);

		this.printService.println('Success.');
	}

	init(config: IConfig): void {
		Config.init(config);

		const hooks = config.hooksFile
			? this.fileService.loadJs<Record<string, HookFn>>(config.hooksFile)
			: undefined;

		Hooks.init(hooks);
	}
}
