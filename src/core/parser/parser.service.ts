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
		const path = '../swagger-reports-api.json';

		const sourceDoc = await SwaggerParser.parse(path);
		const refs = await SwaggerParser.resolve(path);

		const parser = this.parsers.find(x => x.isSupported(sourceDoc));

		if (!parser) {
			throw new Error('Unsupported OpenAPI version.');
		}

		const doc = parser.parse(sourceDoc, refs);

		return doc;
	}
}
