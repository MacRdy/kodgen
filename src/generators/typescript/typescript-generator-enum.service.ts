import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import { JSDocService } from './jsdoc/jsdoc.service';
import {
	generateEntityName,
	ITsEnum,
	ITsEnumEntry,
	ITsGeneratorConfig,
} from './typescript-generator.model';

export class TypescriptGeneratorEnumService {
	constructor(
		private readonly importRegistry: ImportRegistryService,
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

			const model: ITsEnum = {
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
					this.config.enumFileNameResolver(model.name),
				),
				template: this.config.enumTemplate,
				templateData: {
					model,
					jsdoc: new JSDocService(),
				},
			};

			this.importRegistry.createLink(model.name, file.path);

			files.push(file);
		}

		return files;
	}
}
