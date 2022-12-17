import { SchemaEntity } from '../../core/entities/shared.model';

export class ParserRepositoryService<TSource> {
	private static instance?: ParserRepositoryService<unknown>;

	static getInstance<T>(): ParserRepositoryService<T> {
		this.instance ??= new ParserRepositoryService();

		return this.instance as ParserRepositoryService<T>;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	private readonly repository = new Map<TSource | symbol, SchemaEntity>();

	addEntity(entity: SchemaEntity, source?: TSource): void {
		if (source && this.repository.has(source)) {
			throw new Error('Source already added');
		}

		if (this.getAllEntities().some(x => x === entity)) {
			throw new Error('Entity already stored');
		}

		this.repository.set(source ?? Symbol(), entity);
	}

	hasSource(source: TSource): boolean {
		return this.repository.has(source);
	}

	getAllEntities(): SchemaEntity[] {
		return [...this.repository.values()];
	}

	getEntity(source: TSource): SchemaEntity {
		const entity = this.repository.get(source);

		if (!entity) {
			throw new Error('No entity found');
		}

		return entity;
	}
}
