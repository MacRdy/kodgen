import { ParserService } from './core/parser/parser.service';
import { GeneratorService } from './generator/generator.service';

export class AppService {
	private readonly generatorService = new GeneratorService('./codegen');

	async start(): Promise<void> {
		const parser = new ParserService();

		const [doc, resolve] = await parser.parse('../swagger-reports-api.json');

		console.log(doc);

		const generator = this.generatorService.get('test-generator');

		const files = generator.generate(doc, resolve);

		console.log(files);

		await this.generatorService.render(files);

		console.log();
	}
}
