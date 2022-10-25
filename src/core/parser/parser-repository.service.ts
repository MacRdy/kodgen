import { OpenAPIV3 } from 'openapi-types';
import { Entity } from '../document.model';
import { EnumDef } from './entities/enum.model';
import { ObjectModelDef } from './entities/model.model';

export class ParserRepositoryService {
	private readonly schemaRefRepository = new Map<OpenAPIV3.SchemaObject, string>();
	private readonly refEntityRepository = new Map<string, Entity>();

	addEntity(schema: OpenAPIV3.SchemaObject, entity: Entity): void {
		if (this.schemaRefRepository.has(schema)) {
			throw new Error('Schema is already processed.');
		}

		if (this.getEntities().some(x => x === entity)) {
			throw new Error('Entity is already saved.');
		}

		this.schemaRefRepository.set(schema, entity.ref.get());
		this.refEntityRepository.set(entity.ref.get(), entity);
	}

	hasSchema(schema: OpenAPIV3.SchemaObject): boolean {
		return this.schemaRefRepository.has(schema);
	}

	getReference(schema: OpenAPIV3.SchemaObject): string {
		const ref = this.schemaRefRepository.get(schema);

		if (!ref) {
			throw new Error('No reference found.');
		}

		return ref;
	}

	getEntities(): Entity[] {
		return [...this.refEntityRepository.values()].filter(
			x => x instanceof ObjectModelDef || x instanceof EnumDef,
		);
	}

	getEntity(schemaOrRef: string | OpenAPIV3.SchemaObject): Entity {
		if (typeof schemaOrRef === 'string') {
			const entity = this.refEntityRepository.get(schemaOrRef);

			if (!entity) {
				throw new Error('No entity found.');
			}

			return entity;
		}

		const ref = this.getReference(schemaOrRef);

		return this.getEntity(ref);
	}
}
