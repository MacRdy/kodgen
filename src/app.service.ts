import { ParserService } from './core/parser/parser.service';

export class AppService {
	async start(): Promise<void> {
		const parser = new ParserService();

		const [doc, resolve] = await parser.parse('../swagger-reports-api.json');

		console.log(doc);
	}
}
