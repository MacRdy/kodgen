import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { IDocument } from '../../document.model';
import { EnumDef } from '../entities/enum.model';
import { ModelDef, ObjectModelDef } from '../entities/model.model';
import { ReferenceDef } from '../entities/reference.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService, isOpenApiReferenceObject } from '../parser.model';
import { ParserV3EnumService } from './parser-v3-enum.service';
import { ParserV3ModelService } from './parser-v3-model.service';

export class ParserV3Service implements IParserService {
	private readonly repository = new ParserRepositoryService();

	private enumService = new ParserV3EnumService(this.repository);
	private modelService = new ParserV3ModelService(this.repository, this.refs);

	private readonly enums: EnumDef[] = [];
	private readonly models: ModelDef[] = [];

	constructor(
		private readonly doc: OpenAPIV3.Document,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	parse(): IDocument {
		const refs = this.refs.values();
		const ref: OpenAPIV3.Document<{}> = refs['C:\\Repo\\swagger-reports-api.json'];

		if (ref.components?.schemas) {
			for (const [name, obj] of Object.entries(ref.components.schemas)) {
				if (!isOpenApiReferenceObject(obj) && this.repository.hasSchema(obj)) {
					continue;
				}

				this.parseSchema(name, obj);
			}
		}

		const allEntities = this.repository.getEntities();
		const entities = allEntities.filter(
			x => x instanceof ObjectModelDef || x instanceof EnumDef,
		);

		return {
			enums: [],
			models: [],
			paths: [],
		};
	}

	private parseSchema(
		name: string,
		obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): ReferenceDef {
		if (!isOpenApiReferenceObject(obj) && this.enumService.isSupported(obj)) {
			const enumDef = this.enumService.parse(name, obj);
			this.enums.push(enumDef);
			return enumDef.ref;
		} else if (this.modelService.isSupported(obj)) {
			const modelDef = this.modelService.parse(
				name,
				obj,
				(name: string, obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject) =>
					this.parseSchema(name, obj),
			);

			this.models.push(modelDef);

			return modelDef instanceof ReferenceDef ? modelDef : modelDef.ref;
			// models.push(modelDef);
		}

		throw new Error('NO RET');
	}
}
