import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { IParserService } from './parser.model';

export class ParserV3Service implements IParserService<OpenAPIV3.Document> {
	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {}

		return false;
	}

	parse(doc: OpenAPIV3.Document): IDocument {
		return {
			enums: [],
			objects: [],
			paths: [],
		};
	}
}
