import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { IDocument } from '../../document.model';
import { EnumDef } from '../entities/enum.model';
import { ModelDef } from '../entities/model.model';
import { IParserService, isOpenApiReferenceObject } from '../parser.model';
import { ParserV3EnumService } from './parser-v3-enum.service';
import { ParserV3ModelService } from './parser-v3-model.service';

export class ParserV3Service implements IParserService {
	private readonly repository = new Map<string, EnumDef | ModelDef>();

	private enumService = new ParserV3EnumService();
	private modelService = new ParserV3ModelService();

	constructor(
		private readonly doc: OpenAPIV3.Document,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	parse(): IDocument {
		const enums: EnumDef[] = [];
		const models: ModelDef[] = [];

		if (this.doc.components?.schemas) {
			for (const [name, schemaOrRef] of Object.entries(this.doc.components.schemas)) {
				if (isOpenApiReferenceObject(schemaOrRef)) {
					throw new Error('Unsupported reference object.');
				}

				if (this.enumService.isSupported(schemaOrRef)) {
					const enumDef = this.enumService.parse(name, schemaOrRef);

					this.repository.set(enumDef.name, enumDef);
					enums.push(enumDef);
				}

				if (this.modelService.isSupported(schemaOrRef)) {
					const modelDef = this.modelService.parse(name, schemaOrRef);

					this.repository.set(modelDef.name, modelDef);
					models.push(modelDef);
				}
			}
		}

		return {
			enums,
			models,
			paths: [],
		};
	}
}
