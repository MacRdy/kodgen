import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { IParserProviderService, IParserService } from '../parser.model';
import { ParserV3Service } from './parser-v3.service';

export class ParserV3ProviderService implements IParserProviderService<OpenAPIV3.Document> {
	isSupported(doc: OpenAPI.Document<{}>): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {}

		return false;
	}

	create(doc: OpenAPIV3.Document, refs: SwaggerParser.$Refs): IParserService {
		return new ParserV3Service(doc, refs);
	}
}
