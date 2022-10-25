import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { IDocument } from '../../document.model';
import { Reference } from '../entities/reference.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService } from '../parser.model';
import { ParserV3EnumService } from './parser-v3-enum.service';
import { ParserV3ModelService } from './parser-v3-model.service';
import { ParserV3PathService } from './parser-v3-path.service';
import { isOpenApiV3ReferenceObject } from './parser-v3.model';

export class ParserV3Service implements IParserService {
	private readonly repository = new ParserRepositoryService();

	private readonly enumService = new ParserV3EnumService(this.repository);

	private readonly modelService = new ParserV3ModelService(
		this.repository,
		this.refs,
		(name, obj): Reference => this.parseNewSchema(name, obj),
	);

	private readonly pathService = new ParserV3PathService(this.repository, this.refs);

	constructor(
		private readonly doc: OpenAPIV3.Document,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	parse(): IDocument {
		if (this.doc.components?.schemas) {
			for (const [name, obj] of Object.entries(this.doc.components.schemas)) {
				if (!isOpenApiV3ReferenceObject(obj) && this.repository.hasSchema(obj)) {
					continue;
				}

				this.parseNewSchema(name, obj);
			}
		}

		for (const [name, path] of Object.entries(this.doc.paths)) {
			if (path) {
				this.pathService.parse(name, path);
			}
		}

		const allEntities = this.repository.getEntities();

		return {
			enums: [],
			models: [],
			paths: [],
		};
	}

	private parseNewSchema(
		name: string,
		obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): Reference {
		if (this.enumService.isSupported(obj)) {
			return this.enumService.parse(name, obj).ref;
		} else if (this.modelService.isSupported(obj)) {
			return this.modelService.parse(name, obj).ref;
		}

		throw new Error('Unsupported object.');
	}
}
