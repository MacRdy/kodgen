import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import {
	generateEntityName,
	ITsEnum,
	ITsEnumEntry,
	ITsGeneratorConfig,
} from './typescript-generator.model';

export class TypescriptGeneratorEnumService {
	constructor(
		private readonly registry: ImportRegistryService,
		private readonly config: ITsGeneratorConfig,
	) {}

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
				deprecated: e.deprecated,
				description: e.description,
			};

			const file: IGeneratorFile = {
				path: pathLib.posix.join(
					this.config.enumDir,
					this.config.enumFileNameResolver(templateData.name),
				),
				template: this.config.enumTemplate,
				templateData,
			};

			this.registry.createLink(templateData.name, file.path);

			files.push(file);
		}

		return files;
	}
}
