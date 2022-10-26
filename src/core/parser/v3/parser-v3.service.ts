import { OpenAPIV3 } from 'openapi-types';
import { IDocument, SchemaEntity } from '../../document.model';
import { PathDef } from '../entities/path.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParserService } from '../parser.model';
import { ParserV3EnumService } from './parser-v3-enum.service';
import { ParserV3ModelService } from './parser-v3-model.service';
import { ParserV3PathService } from './parser-v3-path.service';
import { isOpenApiV3ReferenceObject } from './parser-v3.model';

export class ParserV3Service implements IParserService {
	private readonly repository = new ParserRepositoryService<
		OpenAPIV3.SchemaObject,
		SchemaEntity
	>();

	private readonly enumService = new ParserV3EnumService(this.repository);

	private readonly modelService = new ParserV3ModelService(
		this.repository,
		(name, schema, required) => this.parseSchemaEntity(name, schema, required),
	);

	private readonly pathService = new ParserV3PathService(
		this.repository,
		(name, schema, required) => this.parseSchemaEntity(name, schema, required),
	);

	constructor(private readonly doc: OpenAPIV3.Document) {}

	parse(): IDocument {
		const schemas = this.doc.components?.schemas;

		if (schemas) {
			for (const [name, schema] of Object.entries(schemas)) {
				if (isOpenApiV3ReferenceObject(schema)) {
					throw new Error('Unresolved schema reference.');
				}

				if (this.repository.hasSource(schema)) {
					continue;
				}

				this.parseSchemaEntity(name, schema);
			}
		}

		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries(this.doc.paths)) {
			if (path) {
				const newPaths = this.pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		const allEntities = this.repository.getEntities();

		return {
			enums: [],
			models: [],
			paths,
		};
	}

	private parseSchemaEntity(
		name: string,
		schema: OpenAPIV3.SchemaObject,
		required?: boolean,
	): SchemaEntity {
		if (this.enumService.isSupported(schema)) {
			return this.enumService.parse(name, schema);
		}

		return this.modelService.parse(name, schema, required);
	}
}
