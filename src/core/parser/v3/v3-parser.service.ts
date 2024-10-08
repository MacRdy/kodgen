import AjvDraft4 from 'ajv-draft-04';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import oas from '../../../../assets/openapi/30-schema.json';
import { IDocument } from '../../entities/document.model';
import { generateAjvErrorMessage } from '../../utils';
import { CommonParserService } from '../common/common-parser.service';
import { IParserService, ParserConfig, ParseSchemaEntityFn } from '../parser.model';
import { V3ParserPathService } from './v3-parser-path.service';
import { V3ParserSchemaService } from './v3-parser-schema.service';

export class V3ParserService implements IParserService<OpenAPIV3.Document> {
	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.schemaService, schema, data);

	private readonly schemaService = new V3ParserSchemaService(this.parseSchemaEntity);
	private readonly pathService = new V3ParserPathService(this.parseSchemaEntity);

	isSupported(definition: OpenAPI.Document): boolean {
		try {
			const v3Definition = definition as OpenAPIV3.Document;

			return /^3\.0\.\d(-.+)?$/.test(v3Definition.openapi);
		} catch {
			return false;
		}
	}

	validate(definition: OpenAPIV3.Document): void {
		const validate = new AjvDraft4({
			allErrors: true,
			strict: false,
			validateFormats: false,
		}).compile(oas);

		if (!validate(definition)) {
			throw new Error(generateAjvErrorMessage('Schema validation failed', validate.errors));
		}
	}

	parse(doc: OpenAPIV3.Document, config?: ParserConfig): IDocument {
		return CommonParserService.parse(
			this.schemaService,
			this.pathService,
			doc.info,
			doc.components?.schemas,
			doc.paths,
			doc.servers,
			doc.tags,
			config,
		);
	}
}
