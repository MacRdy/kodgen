import { IReferable } from '../entities/reference.model';
import { Type } from '../utils';

type GetEntitiesResult<T> = T extends Type<infer R> ? R : never;

export class ParserRepositoryService<TSource, TEntity extends IReferable> {
	private readonly sourceToRefRepository = new Map<TSource, string>();
	private readonly refToEntityRepository = new Map<string, TEntity>();

	addEntity(entity: TEntity, source?: TSource): void {
		if (source && this.sourceToRefRepository.has(source)) {
			throw new Error('Source is already processed.');
		}

		if (this.getEntities().some(x => x === entity)) {
			throw new Error('Entity is already stored.');
		}

		if (source) {
			this.sourceToRefRepository.set(source, entity.ref.get());
		}

		this.refToEntityRepository.set(entity.ref.get(), entity);
	}

	hasSource(source: TSource): boolean {
		return this.sourceToRefRepository.has(source);
	}

	getEntities<T extends Type<TEntity> = Type<TEntity>>(types?: T[]): GetEntitiesResult<T>[] {
		return [...this.refToEntityRepository.values()].filter(
			entity => !types?.length || types.some(type => entity instanceof type),
		) as GetEntitiesResult<T>[];
	}

	getEntity(sourceOrRef: string | TSource): TEntity {
		if (typeof sourceOrRef === 'string') {
			const entity = this.refToEntityRepository.get(sourceOrRef);

			if (!entity) {
				throw new Error('No entity found.');
			}

			return entity;
		}

		const ref = this.getReference(sourceOrRef);

		return this.getEntity(ref);
	}

	private getReference(source: TSource): string {
		const ref = this.sourceToRefRepository.get(source);

		if (!ref) {
			throw new Error('No reference found.');
		}

		return ref;
	}
}
