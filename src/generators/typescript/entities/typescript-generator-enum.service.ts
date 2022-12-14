import pathLib from 'path';
import { EnumDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { IGeneratorFile } from '../../generator.model';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import { ITsEnum, ITsEnumEntry, ITsGeneratorConfig } from '../typescript-generator.model';

export class TypescriptGeneratorEnumService {
	constructor(
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
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

			const storageInfo = this.storage.get(e);

			const name = storageInfo?.name ?? this.namingService.generateUniqueEnumName(e.name);

			this.storage.set(e, { name });

			const generatedModel: ITsEnum = {
				name,
				isStringlyTyped: e.type === 'string',
				entries,
				extensions: e.extensions,
				deprecated: e.deprecated,
				description: e.description,
			};

			const file: IGeneratorFile = {
				path: pathLib.posix.join(
					this.config.enumDir,
					this.config.enumFileNameResolver(generatedModel.name),
				),
				template: this.config.enumTemplate,
				templateData: {
					model: generatedModel,
					jsdoc: new JSDocService(),
					isValidName: (entityName: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(entityName),
				},
			};

			this.importRegistry.createLink(generatedModel.name, file.path);

			this.storage.set(e, { generatedModel });

			files.push(file);
		}

		return files;
	}
}
