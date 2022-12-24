import pathLib from 'path';
import { EnumDef } from '../../../core/entities/schema-entities/enum-def.model';
import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../../core/entities/schema-entities/path-def.model';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { Printer } from '../../../core/printer/printer';
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
			this.printVerbose(e);

			const entries: ITsEnumEntry[] = [];

			for (const enumEntry of e.entries) {
				const entry: ITsEnumEntry = {
					name: enumEntry.name,
					value: enumEntry.value,
					deprecated: enumEntry.deprecated,
					description: enumEntry.description,
					extensions: enumEntry.extensions,
				};

				entries.push(entry);
			}

			const storageInfo = this.storage.get(e);

			const name = storageInfo?.name ?? this.namingService.generateUniqueEnumName(e);

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

	private printVerbose(enumDef: EnumDef): void {
		let originName: string;

		switch (enumDef.origin) {
			case BODY_OBJECT_ORIGIN:
				originName = 'body';
				break;
			case RESPONSE_OBJECT_ORIGIN:
				originName = 'response';
				break;
			case PATH_PARAMETERS_OBJECT_ORIGIN:
				originName = 'path parameters';
				break;
			case QUERY_PARAMETERS_OBJECT_ORIGIN:
				originName = 'query parameters';
				break;
			case FORM_DATA_OBJECT_ORIGIN:
				originName = 'form data';
				break;
			default:
				originName = '';
				break;
		}

		originName = originName ? ` (${originName})` : '';

		Printer.verbose(`Creating enum from '${enumDef.name}'${originName}`);
	}
}
