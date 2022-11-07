import SwaggerParser from '@apidevtools/swagger-parser';
import { IDocument } from '../entities/document.model';
import { Printer } from '../print/printer';
import { IParserProviderService } from './parser.model';
import { ParserV3ProviderService } from './v3/parser-v3-provider.service';

export class ParserService {
	private readonly providers: readonly IParserProviderService[];

	constructor() {
		this.providers = [new ParserV3ProviderService()];
	}

	async parse(path: string): Promise<IDocument> {
		Printer.info('OpenAPI definition loading...');

		const source = await SwaggerParser.dereference(path);

		const provider = this.providers.find(x => x.isSupported(source));

		if (!provider) {
			throw new Error('Unsupported OpenAPI version.');
		}

		Printer.info('Parsing...');

		const parser = provider.create(source);

		return parser.parse();
	}
}
