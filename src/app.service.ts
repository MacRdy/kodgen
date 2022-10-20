import SwaggerParser from '@apidevtools/swagger-parser';

export class AppService {
	async start(): Promise<void> {
		const doc = await SwaggerParser.parse('../swagger-reports-api.json');

		console.log(doc.info.title);
	}
}
