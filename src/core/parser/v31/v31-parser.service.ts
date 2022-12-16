import { OpenAPI, OpenAPIV3_1 } from 'openapi-types';
import { IDocument } from '../../entities/document.model';
import { CommonParserService } from '../common/common-parser.service';
import { IParserService, ParseSchemaEntityFn } from '../parser.model';
import { V31ParserPathService } from './v31-parser-path.service';
import { V31ParserSchemaService } from './v31-parser-schema.service';

export class V31ParserService implements IParserService<OpenAPIV3_1.Document> {
	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.schemaService, schema, data);

	private readonly schemaService = new V31ParserSchemaService(this.parseSchemaEntity);
	private readonly pathService = new V31ParserPathService(this.parseSchemaEntity);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v31Doc = doc as OpenAPIV3_1.Document;

			return v31Doc.openapi === '3.1.0';
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV3_1.Document): IDocument {
		return CommonParserService.parse(
			this.schemaService,
			this.pathService,
			doc.components?.schemas,
			doc.paths,
		);
	}
}
