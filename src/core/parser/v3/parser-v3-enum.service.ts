import { OpenAPIV3 } from 'openapi-types';
import { pascalCase, pascalCaseTransformMerge } from 'pascal-case';
import { EnumDef, EnumEntryDef } from '../../entities/schema-entities/enum-def.model';
import {
	isIntegerType,
	isNumberType,
	isPrimitiveType,
	isStringType,
	SchemaEntity,
} from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions } from './parser-v3.model';

export class ParserV3EnumService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
	) {}

	isSupported(obj: OpenAPIV3.SchemaObject): boolean {
		return !!obj.enum;
	}

	parse(name: string, schema: OpenAPIV3.SchemaObject): EnumDef {
		if (
			!(
				isIntegerType(schema.type) ||
				isNumberType(schema.type) ||
				isStringType(schema.type)
			) ||
			!isPrimitiveType(schema.type)
		) {
			throw new Error('Unsupported enum type.');
		}

		const entries = this.getEntries(schema.enum ?? [], this.getNames(schema));

		const enumDef = new EnumDef(
			name,
			schema.type,
			entries,
			schema.format,
			getExtensions(schema),
		);

		this.repository.addEntity(enumDef, schema);

		return enumDef;
	}

	private getEntries<T>(values: T[], names?: string[]): EnumEntryDef[] {
		const entries: EnumEntryDef[] = [];

		for (let i = 0; i < values.length; i++) {
			const value = values[i];

			if (typeof value !== 'undefined') {
				const entry = new EnumEntryDef(
					names?.[i] ?? this.generateEntryNameByValue(value),
					value,
				);

				entries.push(entry);
			}
		}

		return entries;
	}

	private getNames(schema: OpenAPIV3.SchemaObject): string[] | undefined {
		const xPropNames = ['x-enumNames', 'x-ms-enum', 'x-enum-varnames'] as const;

		for (const propName of xPropNames) {
			if (Object.prototype.hasOwnProperty.call(schema, propName)) {
				const names = (schema as Record<string, unknown>)[propName] as string[];

				if (Array.isArray(names)) {
					return names;
				}
			}
		}

		return undefined;
	}

	private generateEntryNameByValue(value: unknown): string {
		return typeof value === 'string'
			? pascalCase(value, { transform: pascalCaseTransformMerge }) // TODO do not apply pascalCase
			: `_${value}`;
	}
}
