import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI } from 'openapi-types';
import { IDocument } from '../document.model';
import { IParserProviderService } from './parser.model';
import { ParserV3ProviderService } from './v3/parser-v3-provider.service';

export class ParserService {
	private readonly providers: ReadonlyArray<IParserProviderService>;

	constructor() {
		this.providers = [new ParserV3ProviderService()];
	}

	async parse(): Promise<IDocument> {
		const path = '../swagger-reports-api.json';

		const refs = await SwaggerParser.resolve(path);
		const values = refs.values();

		for (const key in values) {
			if (Object.prototype.hasOwnProperty.call(values, key)) {
				const doc: OpenAPI.Document = values[key];

				const provider = this.providers.find(x => x.isSupported(doc));

				if (!provider) {
					throw new Error('Unsupported OpenAPI version.');
				}

				const parser = provider.create(doc, refs);

				const structure = parser.parse();

				return structure;
			}
		}

		throw new Error('Unsupported document.');
	}
}
