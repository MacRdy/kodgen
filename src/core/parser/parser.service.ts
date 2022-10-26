import SwaggerParser from '@apidevtools/swagger-parser';
import { IDocument } from './entities/document.model';
import { IParserProviderService } from './parser.model';
import { ParserV3ProviderService } from './v3/parser-v3-provider.service';

export class ParserService {
	private readonly providers: ReadonlyArray<IParserProviderService>;

	constructor() {
		this.providers = [new ParserV3ProviderService()];
	}

	async parse(path: string): Promise<IDocument> {
		const doc = await SwaggerParser.dereference(path);

		const provider = this.providers.find(x => x.isSupported(doc));

		if (!provider) {
			throw new Error('Unsupported OpenAPI version.');
		}

		const parser = provider.create(doc);

		const structure = parser.parse();

		return structure;
	}
}
