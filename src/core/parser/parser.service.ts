import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { IParserService } from './parser.model';
import { V2ParserService } from './v2/v2-parser.service';
import { V3ParserService } from './v3/v3-parser.service';

export class ParserService {
	private readonly parsers: readonly IParserService[];

	constructor() {
		this.parsers = [new V2ParserService(), new V3ParserService()];
	}

	async parse(content: string): Promise<IDocument> {
		// TODO abstract! yaml/json services
		const resource = JSON.parse(content);

		const parser = this.parsers.find(x => x.isSupported(resource));

		if (!parser) {
			throw new Error('Unsupported OpenAPI version.');
		}

		const openApiDocument = await this.dereference(resource);

		return parser.parse(openApiDocument);
	}

	private async dereference(resource: OpenAPI.Document): Promise<OpenAPI.Document> {
		return SwaggerParser.dereference(resource);
	}
}
