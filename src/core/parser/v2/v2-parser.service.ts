import Ajv from 'ajv';
import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import oasSchema from '../../../../assets/openapi/20-schema.json';
import { IDocument } from '../../entities/document.model';
import { generateAjvErrorMessage } from '../../utils';
import { OpenApiV3xServerObject } from '../common/common-parser.model';
import { CommonParserService } from '../common/common-parser.service';
import { IParserService, ParserConfig, ParseSchemaEntityFn } from '../parser.model';
import { V2ParserPathService } from './v2-parser-path.service';
import { V2ParserSchemaService } from './v2-parser-schema.service';

export class V2ParserService implements IParserService<OpenAPIV2.Document> {
	private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject> = (
		schema,
		data,
	) => CommonParserService.parseSchemaEntity(this.schemaService, schema, data);

	private readonly schemaService = new V2ParserSchemaService(this.parseSchemaEntity);
	private readonly pathService = new V2ParserPathService(this.parseSchemaEntity);

	isSupported(definition: OpenAPI.Document): boolean {
		try {
			const v2Definition = definition as OpenAPIV2.Document;

			return v2Definition.swagger === '2.0';
		} catch {
			return false;
		}
	}

	validate(definition: OpenAPIV2.Document): void {
		const validate = new Ajv({ allErrors: true }).compile(oasSchema);

		if (!validate(definition)) {
			throw new Error(generateAjvErrorMessage('Invalid spec', validate.errors));
		}
	}

	parse(doc: OpenAPIV2.Document, config?: ParserConfig): IDocument {
		return CommonParserService.parse(
			this.schemaService,
			this.pathService,
			doc.definitions,
			doc.paths,
			this.getServers(doc),
			doc.tags,
			config,
		);
	}

	private getServers(doc: OpenAPIV2.Document): OpenApiV3xServerObject[] | undefined {
		if (doc.schemes && doc.host) {
			return doc.schemes.map<OpenApiV3xServerObject>(s => ({
				url: `${s}://${doc.host}${doc.basePath}`,
			}));
		}

		if (doc.basePath) {
			return [{ url: doc.basePath }];
		}

		return undefined;
	}
}
