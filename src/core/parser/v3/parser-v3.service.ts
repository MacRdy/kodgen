import { OpenAPIV3 } from 'openapi-types';
import { IDocument } from '../../entities/document.model';
import { EnumDef } from '../../entities/enum-def.model';
import { ObjectModelDef } from '../../entities/model-def.model';
import { PathDef } from '../../entities/path-def.model';
import { SchemaEntity } from '../../entities/shared.model';
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

	private readonly modelService = new ParserV3ModelService(this.repository, (schema, name) =>
		this.parseSchemaEntity(schema, name),
	);

	private readonly pathService = new ParserV3PathService(this.repository, (schema, name) =>
		this.parseSchemaEntity(schema, name),
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
					const entity = this.repository.getEntity(schema);

					if (name && (entity instanceof EnumDef || entity instanceof ObjectModelDef)) {
						entity.setName(name);
					}

					continue;
				}

				this.parseSchemaEntity(schema, name);
			}
		}

		const paths: PathDef[] = [];

		for (const [pattern, path] of Object.entries(this.doc.paths)) {
			if (path) {
				const newPaths = this.pathService.parse(pattern, path);
				paths.push(...newPaths);
			}
		}

		const enums = this.repository.getEntities([EnumDef]);
		const models = this.repository.getEntities([ObjectModelDef]);

		return { enums, models, paths };
	}

	private parseSchemaEntity(schema: OpenAPIV3.SchemaObject, name: string): SchemaEntity {
		if (this.repository.hasSource(schema)) {
			return this.repository.getEntity(schema);
		}

		if (name && this.enumService.isSupported(schema)) {
			return this.enumService.parse(name, schema);
		}

		return this.modelService.parse(schema, name);
	}
}
