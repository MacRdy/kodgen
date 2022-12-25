import { OpenAPI } from 'openapi-types';
import { IParserService } from './parser.model';
import { V2ParserService } from './v2/v2-parser.service';
import { V3ParserService } from './v3/v3-parser.service';
import { V31ParserService } from './v31/v31-parser.service';

export class ParserService {
	private readonly parsers: readonly IParserService[];

	constructor() {
		this.parsers = [new V2ParserService(), new V3ParserService(), new V31ParserService()];
	}

	get(definition: OpenAPI.Document): IParserService | undefined {
		return this.parsers.find(x => x.isSupported(definition));
	}
}
