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

	generateEntityName(modelDef: IReferenceEntity, modifier?: number): string {
		const name = generateEntityName(this.getRawName(modelDef, modifier));

		if (this.storage.isNameReserved(name)) {
			return this.generateEntityName(modelDef, (modifier ?? 0) + 1);
		}

		return name;
	}

	private getRawName(modelDef: IReferenceEntity, modifier?: number): string {
		if (modelDef.isAutoName()) {
			if (modelDef.getOrigin() === PATH_PARAMETERS_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Path', 'Parameters');
			}

			if (modelDef.getOrigin() === QUERY_PARAMETERS_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Query', 'Parameters');
			}

			if (modelDef.getOrigin() === BODY_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Body');
			}

			if (modelDef.getOrigin() === RESPONSE_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Response');
			}
		}

		return `${modelDef.name}${modifier ?? ''}`;
	}
}
