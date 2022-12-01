import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../core/entities/schema-entities/path-def.model';
import { IReferenceEntity } from '../../core/entities/shared.model';
import { Hooks } from '../../core/hooks/hooks';
import { toCamelCase, toPascalCase } from '../../core/utils';

export class TypescriptGeneratorNamingService {
	private readonly registry = new Map<string, string[]>();

	private readonly referenceEntityNamingScope = 'REFERENCE_ENTITY_NAMING_SCOPE';

	private readonly pathNamingScope = 'PATH_NAMING_SCOPE';

	private readonly getPathUrlNamingScope = (mainEntity: string): string =>
		`PATH_URL_${mainEntity}_NAMING_SCOPE`;

	private readonly getPropertyNamingScope = (mainEntity: string): string =>
		`PROPERTY_${mainEntity}_NAMING_SCOPE`;

	generateUniqueReferenceEntityName(entity: IReferenceEntity, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = this.generateEntityName(...this.getRawName(entity, modifier));

		if (this.isReserved(scope, name)) {
			return this.generateUniqueReferenceEntityName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniquePathEntityName(originalName: string, modifier?: number): string {
		const scope = this.pathNamingScope;
		const name = this.generateEntityName(originalName, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniquePathEntityName(originalName, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniquePathUrlName(key: string, originalNameParts: string[], modifier?: number): string {
		const scope = this.getPathUrlNamingScope(key);
		const name = this.generateMethodName(...originalNameParts, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniquePathUrlName(key, originalNameParts, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniquePropertyName(
		key: string,
		originalNameParts: string[],
		modifier?: number,
	): string {
		const scope = this.getPropertyNamingScope(key);
		const name = this.generatePropertyName(...originalNameParts, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniquePropertyName(key, originalNameParts, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateEntityName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generateEntityName', toPascalCase);

		return fn(...parts);
	}

	generatePropertyName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generatePropertyName', toCamelCase);

		return fn(...parts);
	}

	generateMethodName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generateMethodName', toCamelCase);

		return fn(...parts);
	}

	private reserve(scope: string, name: string): void {
		const names = this.registry.get(scope) ?? [];

		if (names.includes(name)) {
			throw new Error(`Name '${name}' already reserved.`);
		}

		names.push(name);

		this.registry.set(scope, names);
	}

	private getRawName(entity: IReferenceEntity, modifier?: number): string[] {
		if (entity.isAutoName) {
			if (entity.origin === PATH_PARAMETERS_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Path', 'Parameters'];
			}

			if (entity.origin === QUERY_PARAMETERS_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Query', 'Parameters'];
			}

			if (entity.origin === FORM_DATA_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Form', 'Data'];
			}

			if (entity.origin === BODY_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Body'];
			}

			if (entity.origin === RESPONSE_OBJECT_ORIGIN) {
				return [entity.name, `${modifier ?? ''}`, 'Response'];
			}
		}

		return [entity.name, `${modifier ?? ''}`];
	}

	private isReserved(scope: string, name: string): boolean {
		return !!this.registry.get(scope)?.includes(name);
	}
}
