import pathLib from 'path';
import { EnumDef } from '../../core/entities/enum.model';
import { toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { generateEntityName, INgtsEnum, INgtsEnumEntry } from './ng-typescript.model';

export class NgTypescriptEnumService {
	constructor(private readonly registry: Map<string, string>) {}

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

			this.registry.set(templateData.name, file.path);

			files.push(file);
		}

		return files;
	}
}
