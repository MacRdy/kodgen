import pathLib from 'path';
import { EnumDef } from '../../core/entities/schema-entities/enum-def.model';
import { toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { NgTypescriptRegistryService } from './ng-typescript-registry.service';
import { generateEntityName, INgtsEnum, INgtsEnumEntry } from './ng-typescript.model';

export class NgTypescriptEnumService {
	constructor(private readonly registry: NgTypescriptRegistryService) {}

	generate(enums: EnumDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const e of enums) {
			const entries: INgtsEnumEntry[] = [];

			for (const enumEntry of e.entries) {
				const entry: INgtsEnumEntry = {
					name: enumEntry.name,
					value: enumEntry.value,
				};

				entries.push(entry);
			}

			const templateData: INgtsEnum = {
				name: generateEntityName(e.name),
				isStringlyTyped: e.type === 'string',
				entries,
			};

			const file: IGeneratorFile = {
				path: pathLib.posix.join('enums', `${toKebabCase(e.name)}.ts`),
				templateUrl: 'enum',
				templateData,
			};

			this.registry.createLink(templateData.name, file.path);

			files.push(file);
		}

		return files;
	}
}
