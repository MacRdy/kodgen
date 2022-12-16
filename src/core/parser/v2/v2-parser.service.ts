import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import { IDocument } from '../../entities/document.model';
import { CommonParserService } from '../common/common-parser.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService, ParseSchemaEntityFn } from '../parser.model';
import { V2ParserPathService } from './v2-parser-path.service';
import { V2ParserSchemaService } from './v2-parser-schema.service';

export class V2ParserService implements IParserService<OpenAPIV2.Document> {
	private readonly repository = new ParserRepositoryService<OpenAPIV2.SchemaObject>();

	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.repository, this.modelService, schema, data);

	private readonly modelService = new V2ParserSchemaService(
		this.repository,
		this.parseSchemaEntity,
	);

	private readonly pathService = new V2ParserPathService(this.repository, this.parseSchemaEntity);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV2.Document;

			return v3Doc.swagger === '2.0';
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV2.Document): IDocument {
		return CommonParserService.parse(
			this.repository,
			this.modelService,
			this.pathService,
			doc.definitions,
			doc.paths,
		);
	}
}
