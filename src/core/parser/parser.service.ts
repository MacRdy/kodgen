import SwaggerParser from '@apidevtools/swagger-parser';
import { IDocument } from '../document.model';
import { ParserV3Factory } from './parser-v3.service';
import { IParserProvider } from './parser.model';

export class ParserService {
	private readonly providers: ReadonlyArray<IParserProvider>;

	constructor() {
		this.providers = [new ParserV3Factory()];
	}

	async parse(): Promise<IDocument> {
		const path = '../swagger-reports-api.json';

		const sourceDoc = await SwaggerParser.parse(path);
		const refs = await SwaggerParser.resolve(path);

		const provider = this.providers.find(x => x.isSupported(sourceDoc));

		if (!provider) {
			throw new Error('Unsupported OpenAPI version.');
		}

		const parser = provider.create(sourceDoc, refs);

		const doc = parser.parse();

		return doc;
	}
}
