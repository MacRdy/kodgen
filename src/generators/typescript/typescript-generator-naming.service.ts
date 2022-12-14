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

	private readonly serviceNamingScope = 'SERVICE_NAMING_SCOPE';

	private readonly getMethodNamingScope = (mainEntity: string): string =>
		`${mainEntity}_METHOD_NAMING_SCOPE`;

	private readonly getPropertyNamingScope = (mainEntity: string): string =>
		`${mainEntity}_PROPERTY_NAMING_SCOPE`;

	generateUniqueEnumName(originalName: string, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = this.generateEnumName(originalName);

		if (this.isReserved(scope, name)) {
			return this.generateUniqueEnumName(originalName, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniqueModelName(entity: IReferenceEntity, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = this.generateModelName(...this.getRawName(entity, modifier));

		if (this.isReserved(scope, name)) {
			return this.generateUniqueModelName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniqueServiceName(originalName: string, modifier?: number): string {
		const scope = this.serviceNamingScope;
		const name = this.generateServiceName(originalName, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniqueServiceName(originalName, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniqueMethodName(key: string, originalNameParts: string[], modifier?: number): string {
		const scope = this.getMethodNamingScope(key);
		const name = this.generateMethodName(...originalNameParts, `${modifier ?? ''}`);

		if (this.isReserved(scope, name)) {
			return this.generateUniqueMethodName(key, originalNameParts, (modifier ?? 0) + 1);
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

	generateServiceName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generateServiceName', toPascalCase);

		return fn(...parts);
	}

	private generateEnumName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generateEnumName', toPascalCase);

		return fn(...parts);
	}

	private generateModelName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generateModelName', toPascalCase);

		return fn(...parts);
	}

	private generatePropertyName(...parts: string[]): string {
		const fn = Hooks.getOrDefault('generatePropertyName', toCamelCase);

		return fn(...parts);
	}

	private generateMethodName(...parts: string[]): string {
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
		if (!entity.originalName) {
			switch (entity.origin) {
				case PATH_PARAMETERS_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'Path', 'Parameters'];
				case QUERY_PARAMETERS_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'Query', 'Parameters'];
				case FORM_DATA_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'Form', 'Data'];
				case BODY_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'Body'];
				case RESPONSE_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'Response'];
			}
		}

		return [entity.name, `${modifier ?? ''}`];
	}

	private isReserved(scope: string, name: string): boolean {
		return !!this.registry.get(scope)?.includes(name);
	}
}
