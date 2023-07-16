import Ajv from 'ajv';
import { OpenAPI, OpenAPIV3_1 } from 'openapi-types';
import oasSchema from '../../../../assets/openapi/31-schema.json';
import { IDocument } from '../../entities/document.model';
import { generateAjvErrorMessage } from '../../utils';
import { CommonParserService } from '../common/common-parser.service';
import { IParserService, ParserConfig, ParseSchemaEntityFn } from '../parser.model';
import { V31ParserPathService } from './v31-parser-path.service';
import { V31ParserSchemaService } from './v31-parser-schema.service';

export class V31ParserService implements IParserService<OpenAPIV3_1.Document> {
	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.schemaService, schema, data);

	private readonly schemaService = new V31ParserSchemaService(this.parseSchemaEntity);
	private readonly pathService = new V31ParserPathService(this.parseSchemaEntity);

	isSupported(definition: OpenAPI.Document): boolean {
		try {
			const v31Definition = definition as OpenAPIV3_1.Document;

			return /^3\.1\.\d+(-.+)?$/.test(v31Definition.openapi);
		} catch {
			return false;
		}
	}

	validate(definition: OpenAPIV3_1.Document): void {
		const validate = new Ajv({ allErrors: true }).compile(oasSchema);

		if (!validate(definition)) {
			throw new Error(generateAjvErrorMessage('Invalid spec', validate.errors));
		}
	}

	parse(doc: OpenAPIV3_1.Document, config?: ParserConfig): IDocument {
		return CommonParserService.parse(
			this.schemaService,
			this.pathService,
			doc.components?.schemas,
			doc.paths,
			doc.servers,
			doc.tags,
			config,
		);
	}
}
