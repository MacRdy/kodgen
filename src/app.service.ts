import { IAppOptions } from './app.model';
import { ParserService } from './core/parser/parser.service';
import { PrintService } from './core/print.service';
import { GeneratorService } from './generators/generator.service';

export class AppService {
	private readonly generatorService = new GeneratorService();
	private readonly parser = new ParserService();
	private readonly printService = PrintService.getInstance();

	async start(options: IAppOptions): Promise<void> {
		this.printService.println('Started.');

		const doc = await this.parser.parse(options.input);

		this.printService.println('Check generator...');

		const generator = this.generatorService.get(options.generator);

		this.printService.println('Files generation...');

		const files = generator.generate(doc);

		await this.generatorService.build(
			options.output,
			!!options.clean,
			options.templateFolder ?? generator.getTemplateFolder(),
			files,
		);

		this.printService.println('Success.');
	}
}
