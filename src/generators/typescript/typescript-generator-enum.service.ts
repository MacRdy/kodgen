import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import { generateEntityName, ITsEnum, ITsEnumEntry } from './typescript-generator.model';

export class TypescriptGeneratorEnumService {
	constructor(private readonly registry: ImportRegistryService) {}

	generate(enums: EnumDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const e of enums) {
			const entries: ITsEnumEntry[] = [];

			for (const enumEntry of e.entries) {
				const entry: ITsEnumEntry = {
					name: enumEntry.name,
					value: enumEntry.value,
				};

				entries.push(entry);
			}

			const templateData: ITsEnum = {
				name: generateEntityName(e.name),
				isStringlyTyped: e.type === 'string',
				entries,
				extensions: e.extensions,
			};

			const file: IGeneratorFile = {
				path: pathLib.posix.join('enums', toKebabCase(templateData.name)),
				template: 'enum',
				templateData,
			};

			this.registry.createLink(templateData.name, file.path);

			files.push(file);
		}

		return files;
	}
}
