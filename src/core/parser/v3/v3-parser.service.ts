import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { ParseSchemaEntityFn } from '../../../core/parser/parser.model';
import { IDocument } from '../../entities/document.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonParserService } from '../common/common-parser.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService } from '../parser.model';
import { V3ParserPathService } from './v3-parser-path.service';
import { V3ParserSchemaService } from './v3-parser-schema.service';

export class V3ParserService implements IParserService<OpenAPIV3.Document> {
	private readonly repository = new ParserRepositoryService<
		OpenAPIV3.SchemaObject,
		SchemaEntity
	>();

	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.repository, this.modelService, schema, data);

	private readonly modelService = new V3ParserSchemaService(
		this.repository,
		this.parseSchemaEntity,
	);

	private readonly pathService = new V3ParserPathService(this.repository, this.parseSchemaEntity);

	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {
			return false;
		}
	}

	parse(doc: OpenAPIV3.Document): IDocument {
		return CommonParserService.parse(
			this.repository,
			this.modelService,
			this.pathService,
			doc.components?.schemas,
			doc.paths,
		);
	}
}
