import { ParserService } from './core/parser/parser.service';

export class AppService {
	// private readonly generatorService = new GeneratorService();

	async start(): Promise<void> {
		const parser = new ParserService();

		const doc = await parser.parse('../swagger-reports-api.json');

		// const generator = this.generatorService.get('ng-typescript');

		// const files = generator.generate(doc);

		// await this.generatorService.build(
		// 	'./build/codegen',
		// 	true,
		// 	generator.getTemplateFolder(),
		// 	files,
		// );

		console.log();
	}
}
