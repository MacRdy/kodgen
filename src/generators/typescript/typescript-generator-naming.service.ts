import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { IReferenceEntity } from '@core/entities/shared.model';
import { mergeParts } from '@core/utils';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { generateEntityName } from './typescript-generator.model';

export class TypescriptGeneratorNamingService {
	constructor(private readonly storage: TypescriptGeneratorStorageService) {}

	generateReferenceEntityName(entity: IReferenceEntity, modifier?: number): string {
		const name = generateEntityName(this.getRawName(entity, modifier));

		if (this.isNameReserved(name)) {
			return this.generateReferenceEntityName(entity, (modifier ?? 0) + 1);
		}

		return name;
	}

	private getRawName(entity: IReferenceEntity, modifier?: number): string {
		if (entity.isAutoName()) {
			if (entity.getOrigin() === PATH_PARAMETERS_OBJECT_ORIGIN) {
				return mergeParts(entity.name, `${modifier ?? ''}`, 'Path', 'Parameters');
			}

			if (entity.getOrigin() === QUERY_PARAMETERS_OBJECT_ORIGIN) {
				return mergeParts(entity.name, `${modifier ?? ''}`, 'Query', 'Parameters');
			}

			if (entity.getOrigin() === BODY_OBJECT_ORIGIN) {
				return mergeParts(entity.name, `${modifier ?? ''}`, 'Body');
			}

			if (entity.getOrigin() === RESPONSE_OBJECT_ORIGIN) {
				return mergeParts(entity.name, `${modifier ?? ''}`, 'Response');
			}
		}

		return `${entity.name}${modifier ?? ''}`;
	}

	private isNameReserved(name: string): boolean {
		return this.storage
			.getSummary()
			.map(x => x.name)
			.some(x => x === name);
	}
}
