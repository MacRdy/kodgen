import SwaggerParser from '@apidevtools/swagger-parser';
import jsYaml, { JSON_SCHEMA } from 'js-yaml';
import { OpenAPI } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { IParserService } from './parser.model';
import { V2ParserService } from './v2/v2-parser.service';
import { V3ParserService } from './v3/v3-parser.service';
import { V31ParserService } from './v31/v31-parser.service';

export class ParserService {
	private readonly parsers: readonly IParserService[];

	constructor() {
		this.parsers = [new V2ParserService(), new V3ParserService(), new V31ParserService()];
	}

	async parse(resource: string): Promise<IDocument> {
		const rawDocument = this.prepareDocument(resource);

		const parser = this.parsers.find(x => x.isSupported(rawDocument));

		if (!parser) {
			throw new Error('Unsupported OpenAPI version');
		}

		const document = await this.dereference(rawDocument);

		return parser.parse(document);
	}

	private async dereference(resource: OpenAPI.Document): Promise<OpenAPI.Document> {
		return SwaggerParser.dereference(resource);
	}

	private prepareDocument(data: string): OpenAPI.Document {
		return jsYaml.load(data, { schema: JSON_SCHEMA }) as OpenAPI.Document;
	}
}
