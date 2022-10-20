import { ParserService } from './core/parser/parser.service';

export class AppService {
	async start(): Promise<void> {
		const parser = new ParserService();

		await parser.parse();

		// console.log(doc.info.title);
	}
}
