import { ParserService } from './core/parser/parser.service';
import { GeneratorService } from './generator/generator.service';

export class AppService {
	private readonly generatorService = new GeneratorService();

	async start(): Promise<void> {
		const parser = new ParserService();

		const [doc, resolve] = await parser.parse('../swagger-reports-api.json');

		const generator = this.generatorService.get('test-generator');

		const files = generator.generate(doc, resolve);

		await this.generatorService.build('./build/codegen', files);

		console.log();
	}
}
