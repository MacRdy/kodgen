import { Config } from '../../../core/config/config';
import { ExtendedModelDef } from '../../../core/entities/schema-entities/extended-model-def.model';
import { SchemaEntity } from '../../../core/entities/shared.model';
import { Type } from '../../../core/utils';

export class CommonParserService {
	static isNecessaryToGenerate(pattern: string): boolean {
		const includePaths = Config.get().includePaths;

		if (includePaths) {
			return includePaths.some(re => new RegExp(re).test(pattern));
		}

		const excludePaths = Config.get().excludePaths;

		if (excludePaths) {
			return !excludePaths.some(re => new RegExp(re).test(pattern));
		}

		return true;
	}

	static selectEntities<T extends SchemaEntity>(entities: SchemaEntity[], type: Type<T>): T[] {
		const selected: Set<T> = new Set<T>();

		for (const entity of entities) {
			if (entity instanceof type) {
				selected.add(entity);
			} else if (entity instanceof ExtendedModelDef) {
				for (const defEntity of this.selectEntities(entity.def, type)) {
					selected.add(defEntity);
				}
			}
		}

		return [...selected.values()];
	}
}
