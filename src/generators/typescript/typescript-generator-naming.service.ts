import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../core/entities/schema-entities/path-def.model';
import { IReferenceModel } from '../../core/entities/shared.model';
import { Hooks } from '../../core/hooks/hooks';
import { toCamelCase, toPascalCase } from '../../core/utils';
import {
	TsGenGenerateMethodName,
	TsGenGenerateName,
	TsGenGeneratePropertyName,
} from './typescript-generator.model';

export class TypescriptGeneratorNamingService {
	private readonly registry = new Map<string, string[]>();

	private readonly referenceEntityNamingScope = 'REFERENCE_ENTITY_NAMING_SCOPE';

	private readonly serviceNamingScope = 'SERVICE_NAMING_SCOPE';

	private readonly getMethodNamingScope = (mainEntity: string): string =>
		`${mainEntity}_METHOD_NAMING_SCOPE`;

	private readonly getPropertyNamingScope = (mainEntity: string): string =>
		`${mainEntity}_PROPERTY_NAMING_SCOPE`;

	generateUniqueEnumName(entity: IReferenceModel, modifier?: number): string {
		const scope = this.referenceEntityNamingScope;
		const name = this.generateEnumName(...this.getRawName(entity, modifier));

		if (this.isReserved(scope, name)) {
			return this.generateUniqueEnumName(entity, (modifier ?? 0) + 1);
		}

		this.reserve(scope, name);

		return name;
	}

	generateUniqueModelName(entity: IReferenceModel, modifier?: number): string {
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

	generateUniqueMethodName(key: string, name: string, modifier?: number): string {
		const scope = this.getMethodNamingScope(key);
		const generatedName = this.generateMethodName(name, modifier);

		if (this.isReserved(scope, generatedName)) {
			return this.generateUniqueMethodName(key, name, (modifier ?? 0) + 1);
		}

		this.reserve(scope, generatedName);

		return generatedName;
	}

	generateUniquePropertyName(key: string, name: string, modifier?: number): string {
		const scope = this.getPropertyNamingScope(key);
		const generatedName = this.generatePropertyName(name, modifier);

		if (this.isReserved(scope, generatedName)) {
			return this.generateUniquePropertyName(key, name, (modifier ?? 0) + 1);
		}

		this.reserve(scope, generatedName);

		return generatedName;
	}

	generateServiceName(...parts: string[]): string {
		const fn = Hooks.getOrDefault<TsGenGenerateName>('generateServiceName', toPascalCase);

		return fn(...parts);
	}

	private generateEnumName(...parts: string[]): string {
		const fn = Hooks.getOrDefault<TsGenGenerateName>('generateEnumName', toPascalCase);

		return fn(...parts);
	}

	private generateModelName(...parts: string[]): string {
		const fn = Hooks.getOrDefault<TsGenGenerateName>('generateModelName', toPascalCase);

		return fn(...parts);
	}

	private generatePropertyName(name: string, modifier?: number): string {
		const fn = Hooks.getOrDefault<TsGenGeneratePropertyName>('generatePropertyName', (n, m) =>
			toCamelCase(n, `${m ?? ''}`),
		);

		return fn(name, modifier);
	}

	private generateMethodName(name: string, modifier?: number): string {
		const fn = Hooks.getOrDefault<TsGenGenerateMethodName>('generateMethodName', (n, m) =>
			toCamelCase(n, `${m ?? ''}`),
		);

		return fn(name, modifier);
	}

	private reserve(scope: string, name: string): void {
		const names = this.registry.get(scope) ?? [];

		if (names.includes(name)) {
			throw new Error(`Duplicate name found ('${name}')`);
		}

		names.push(name);

		this.registry.set(scope, names);
	}

	private getRawName(entity: IReferenceModel, modifier?: number): string[] {
		if (!entity.originalName) {
			switch (entity.origin) {
				case PATH_PARAMETERS_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'PathParameters'];
				case QUERY_PARAMETERS_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'QueryParameters'];
				case FORM_DATA_OBJECT_ORIGIN:
					return [entity.name, `${modifier ?? ''}`, 'FormData'];
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
