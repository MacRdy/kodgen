import SwaggerParser from '@apidevtools/swagger-parser';
import { IDocument } from '../entities/document.model';
import { ParserV3Service } from './parser-v3.service';
import { IParserService } from './parser.model';

export class ParserService {
	private readonly parsers: ReadonlyArray<IParserService>;

	constructor() {
		this.parsers = [new ParserV3Service()];
	}

	async parse(): Promise<IDocument> {
		const src = await SwaggerParser.parse('../swagger-reports-api.json');

		const parser = this.parsers.find(x => x.isSupported(src));

		if (!parser) {
			throw new Error('Unsupported OpenAPI version.');
		}

		const doc = parser.parse(src);

		return doc;
	}
}
