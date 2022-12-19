import { SchemaEntity } from '../../core/entities/shared.model';

export class ParserRepositoryService<TSource, TEntity = SchemaEntity> {
	private static instance?: ParserRepositoryService<unknown>;

	static getInstance<T1, T2 = SchemaEntity>(): ParserRepositoryService<T1, T2> {
		this.instance ??= new ParserRepositoryService();

		return this.instance as ParserRepositoryService<T1, T2>;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	private readonly repository = new Map<TSource | symbol, TEntity>();

	addEntity(entity: TEntity, source?: TSource): void {
		if (source && this.repository.has(source)) {
			throw new Error('Duplicate schema found');
		}

		if (this.getAllEntities().some(x => x === entity)) {
			throw new Error('Duplicate entity found');
		}

		this.repository.set(source ?? Symbol(), entity);
	}

	hasSource(source: TSource): boolean {
		return this.repository.has(source);
	}

	getAllEntities(): TEntity[] {
		return [...this.repository.values()];
	}

	getEntity(source: TSource): TEntity {
		const entity = this.repository.get(source);

		if (!entity) {
			throw new Error('No schema entity found');
		}

		return entity;
	}
}
