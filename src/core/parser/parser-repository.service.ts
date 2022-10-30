import { Type } from '../utils';

type GetEntitiesResult<T> = T extends Type<infer R> ? R : never;

export class ParserRepositoryService<TSource, TEntity> {
	private readonly repository = new Map<TSource | symbol, TEntity>();

	addEntity(entity: TEntity, source?: TSource): void {
		if (source && this.repository.has(source)) {
			throw new Error('Source is already processed.');
		}

		if (this.getEntities().some(x => x === entity)) {
			throw new Error('Entity is already stored.');
		}

		this.repository.set(source ?? Symbol(), entity);
	}

	hasSource(source: TSource): boolean {
		return this.repository.has(source);
	}

	getEntities<T extends Type<TEntity> = Type<TEntity>>(types?: T[]): GetEntitiesResult<T>[] {
		return [...this.repository.values()].filter(
			entity => !types?.length || types.some(type => entity instanceof type),
		) as GetEntitiesResult<T>[];
	}

	getEntity(source: TSource): TEntity {
		const entity = this.repository.get(source);

		if (!entity) {
			throw new Error('No entity found.');
		}

		return entity;
	}
}
