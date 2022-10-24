import { OpenAPIV3 } from 'openapi-types';
import { IReferable, Reference } from './entities/reference.model';

export class ParserRepositoryService {
	private readonly schemaRefRepository = new Map<OpenAPIV3.SchemaObject, Reference>();
	private readonly refEntityRepository = new Map<Reference, IReferable>();

	addEntity(schema: OpenAPIV3.SchemaObject, entity: IReferable): void {
		if (this.schemaRefRepository.has(schema)) {
			throw new Error('Schema is already processed.');
		}

		this.schemaRefRepository.set(schema, entity.ref);
		this.refEntityRepository.set(entity.ref, entity);
	}

	hasSchema(schema: OpenAPIV3.SchemaObject): boolean {
		return this.schemaRefRepository.has(schema);
	}

	getReference(schema: OpenAPIV3.SchemaObject): Reference {
		const ref = this.schemaRefRepository.get(schema);

		if (!ref) {
			throw new Error('No reference found.');
		}

		return ref;
	}

	getEntities(): IReferable[] {
		return [...this.refEntityRepository.values()];
	}

	getEntity(ref: Reference): IReferable {
		const entity = this.refEntityRepository.get(ref);

		if (!entity) {
			throw new Error('No entity found.');
		}

		return entity;
	}
}
