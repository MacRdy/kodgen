import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { IReferenceEntity } from '@core/entities/shared.model';
import { generateEntityName, generateMethodName } from './typescript-generator.model';

export class TypescriptGeneratorNamingService {
	private readonly registry = new Map<string, string[]>();

	private readonly referenceEntityNamingScope = 'REFERENCE_ENTITY_NAMING_SCOPE';

	private readonly pathNamingScope = 'PATH_NAMING_SCOPE';

	private readonly getPathUrlNamingScope = (mainEntity: string): string =>
		`PATH_URL_${mainEntity}_NAMING_SCOPE`;

	generateUniqueReferenceEntityName(entity: IReferenceEntity, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = generateEntityName(...this.getRawName(entity, modifier));

		if (this.isReserved(scope, name)) {
			return this.generateUniqueReferenceEntityName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniquePathEntityName(originalName: string, modifier?: number): string {
		const scope = this.pathNamingScope;
		const name = generateEntityName(originalName, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniquePathEntityName(originalName, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniquePathUrlName(
		entityName: string,
		originalNameParts: string[],
		modifier?: number,
	): string {
		const scope = this.getPathUrlNamingScope(entityName);
		const name = generateMethodName(...originalNameParts, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniquePathUrlName(
				entityName,
				originalNameParts,
				(modifier ?? 0) + 1,
			);
		}

		this.reserve(scope, name);

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

	private getRawName(entity: IReferenceEntity, modifier?: number): string[] {
		if (entity.isAutoName()) {
			if (entity.getOrigin() === PATH_PARAMETERS_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Path', 'Parameters'];
			}

			if (entity.getOrigin() === QUERY_PARAMETERS_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Query', 'Parameters'];
			}

			if (entity.getOrigin() === BODY_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Body'];
			}

			if (entity.getOrigin() === RESPONSE_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Response'];
			}
		}

		return [entity.name, `${modifier ?? ''}`];
	}

	private isReserved(scope: string, name: string): boolean {
		return !!this.registry.get(scope)?.includes(name);
	}
}
