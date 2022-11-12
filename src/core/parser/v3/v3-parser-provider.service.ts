import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { IParserProviderService, IParserService } from '../parser.model';
import { V3ParserService } from './v3-parser.service';

export class V3ParserProviderService implements IParserProviderService {
	isSupported(doc: OpenAPI.Document<Record<string, never>>): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {
			return false;
		}
	}

	create(doc: OpenAPIV3.Document): IParserService {
		return new V3ParserService(doc);
	}
}
