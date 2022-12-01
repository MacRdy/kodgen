import SwaggerParser from '@apidevtools/swagger-parser';
import { IDocument } from '../entities/document.model';
import { IParserProviderService } from './parser.model';
import { V3ParserProviderService } from './v3/v3-parser-provider.service';

export class ParserService {
	private readonly providers: readonly IParserProviderService[];

	constructor() {
		this.providers = [new V3ParserProviderService()];
	}

	async parse(content: string): Promise<IDocument> {
		// TODO abstract! yaml/json services
		const resource = JSON.parse(content);
		const source = await SwaggerParser.dereference(resource);

		const provider = this.providers.find(x => x.isSupported(source));

		if (!provider) {
			throw new Error('Unsupported OpenAPI version.');
		}

		const parser = provider.create(source);

		return parser.parse();
	}
}
