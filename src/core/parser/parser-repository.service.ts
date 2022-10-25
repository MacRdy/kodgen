import { EnumDef } from './entities/enum.model';
import { ObjectModelDef } from './entities/model.model';
import { IReferable } from './entities/reference.model';

export class ParserRepositoryService<TSource, TEntity extends IReferable> {
	private readonly sourceToRefRepository = new Map<TSource, string>();
	private readonly refToEntityRepository = new Map<string, TEntity>();

	addEntity(source: TSource, entity: TEntity): void {
		if (this.sourceToRefRepository.has(source)) {
			throw new Error('Source is already processed.');
		}

		if (this.getEntities().some(x => x === entity)) {
			throw new Error('Entity is already stored.');
		}

		this.sourceToRefRepository.set(source, entity.ref.get());
		this.refToEntityRepository.set(entity.ref.get(), entity);
	}

	hasSource(source: TSource): boolean {
		return this.sourceToRefRepository.has(source);
	}

	getEntities(): TEntity[] {
		return [...this.refToEntityRepository.values()].filter(
			x => x instanceof ObjectModelDef || x instanceof EnumDef,
		);
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
