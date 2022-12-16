import { OpenAPI, OpenAPIV3_1 } from 'openapi-types';
import { IDocument } from '../../entities/document.model';
import { CommonParserService } from '../common/common-parser.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService, ParseSchemaEntityFn } from '../parser.model';
import { V31ParserPathService } from './v31-parser-path.service';
import { V31ParserSchemaService } from './v31-parser-schema.service';

export class V31ParserService implements IParserService<OpenAPIV3_1.Document> {
	private readonly repository = new ParserRepositoryService<OpenAPIV3_1.SchemaObject>();

	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.repository, this.modelService, schema, data);

	private readonly modelService = new V31ParserSchemaService(
		this.repository,
		this.parseSchemaEntity,
	);

	private readonly pathService = new V31ParserPathService(
		this.repository,
		this.parseSchemaEntity,
	);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3_1.Document;

			return v3Doc.openapi === '3.1.0';
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV3_1.Document): IDocument {
		return CommonParserService.parse(
			this.repository,
			this.modelService,
			this.pathService,
			doc.components?.schemas,
			doc.paths,
		);
	}
}
