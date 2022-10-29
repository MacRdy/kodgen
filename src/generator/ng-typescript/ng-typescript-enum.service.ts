import { EnumDef } from '../../core/entities/enum.model';
import { toKebabCase, toPascalCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { INgtsEnum, INgtsEnumEntry } from './ng-typescript.model';

export class NgTypescriptEnumService {
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
				name: toPascalCase(e.name),
				isStringlyTyped: e.type === 'string',
				entries,
			};

			const file: IGeneratorFile = {
				path: `./enums/${toKebabCase(e.name)}.ts`,
				templateUrl: 'enum',
				templateData,
			};

			files.push(file);
		}

		return files;
	}
}
