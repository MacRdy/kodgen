import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { Entity, IDocument } from '../../document.model';
import { IParserService } from '../parser.model';
import { ParserV3EnumService } from './parser-v3-enum.service';
import { ParserV3ModelService } from './parser-v3-model.service';
import { ParserV3PathService } from './parser-v3-path.service';
import { ParserV3RepositoryService } from './parser-v3-repository.service';
import { isOpenApiV3ReferenceObject } from './parser-v3.model';

export class ParserV3Service implements IParserService {
	private readonly repository = new ParserV3RepositoryService();

	private readonly enumService = new ParserV3EnumService(this.repository);

	private readonly modelService = new ParserV3ModelService(
		this.repository,
		this.refs,
		(name, obj, required) => this.parseEntity(name, obj, required),
	);

	private readonly pathService = new ParserV3PathService(
		this.repository,
		this.refs,
		(name, obj, required) => this.parseEntity(name, obj, required),
	);

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

				this.parseEntity(name, obj);
			}
		}

		for (const [pattern, path] of Object.entries(this.doc.paths)) {
			if (path) {
				this.pathService.parse(pattern, path);
			}
		}

		const allEntities = this.repository.getEntities();

		return {
			enums: [],
			models: [],
			paths: [],
		};
	}

	private parseEntity(
		name: string,
		obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
		required?: boolean,
	): Entity {
		if (this.enumService.isSupported(obj)) {
			return this.enumService.parse(name, obj);
		} else if (this.modelService.isSupported(obj)) {
			return this.modelService.parse(name, obj, required);
		}

		throw new Error('Unsupported object.');
	}
}
