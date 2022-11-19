import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { IReferenceEntity } from '@core/entities/shared.model';
import { mergeParts } from '@core/utils';
import { generateEntityName, generateMethodName } from './typescript-generator.model';

export class TypescriptGeneratorNamingService {
	private readonly registry = new Map<string, string[]>();

	private readonly referenceEntityNamingScope = 'REFERENCE_ENTITY_NAMING_SCOPE';

	private readonly pathNamingScope = 'PATH_NAMING_SCOPE';

	private readonly getPathMethodNamingScope = (mainEntity: string): string =>
		`PATH_METHOD_${mainEntity}_NAMING_SCOPE`;

	generateReferenceEntityName(entity: IReferenceEntity, modifier?: number): string {
		const name = generateEntityName(this.getRawName(entity, modifier));

		if (this.isReserved(this.referenceEntityNamingScope, name)) {
			return this.generateReferenceEntityName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(this.referenceEntityNamingScope, name);

		return name;
	}

	generatePathEntityName(originalName: string, modifier?: number): string {
		const name = generateEntityName(`${originalName}${modifier ?? ''}`);

		if (this.isReserved(this.pathNamingScope, name)) {
			return this.generatePathEntityName(originalName, (modifier ?? 0) + 1);
		}

		this.reserve(this.pathNamingScope, name);

		return name;
	}

	generateMethodName(mainEntity: string, originalName: string, modifier?: number): string {
		const name = generateMethodName(`${originalName}${modifier ?? ''}`);

		if (this.isReserved(this.getPathMethodNamingScope(mainEntity), name)) {
			return this.generateMethodName(mainEntity, originalName, (modifier ?? 0) + 1);
		}

		this.reserve(this.getPathMethodNamingScope(mainEntity), name);

		return name;
	}

	private reserve(scope: string, name: string): void {
		const names = this.registry.get(scope) ?? [];

		if (names.includes(name)) {
			throw new Error('Name already reserved.');
		}

		names.push(name);

		this.registry.set(scope, names);
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

	private isReserved(scope: string, name: string): boolean {
		return !!this.registry.get(scope)?.includes(name);
	}
}
