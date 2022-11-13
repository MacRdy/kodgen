import { EnumDef, EnumEntryDef } from '@core/entities/schema-entities/enum-def.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { toKebabCase } from '@core/utils';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { generateEntityName, ITsEnum } from './typescript-generator.model';
import { testingTypescriptGeneratorConfig } from './typescript-generator.service.spec';

jest.mock('@core/import-registry/import-registry.service');
jest.mock('@core/utils');
jest.mock('./typescript-generator.model');

describe('typescript-generator-enum', () => {
	it('should generate file from enum def', () => {
		const importRegistryServiceMock = jest.mocked(ImportRegistryService);
		const generateEntityNameMock = jest.mocked(generateEntityName);
		const toKebabCaseMock = jest.mocked(toKebabCase);

		generateEntityNameMock.mockReturnValueOnce('EnumName');
		toKebabCaseMock.mockReturnValueOnce('enum-name');

		const entries: EnumEntryDef[] = [
			new EnumEntryDef('entry1', 1),
			new EnumEntryDef('entry2', 2),
		];

		const enumDef = new EnumDef('enumName', 'integer', entries, undefined, 'int32', undefined, {
			'x-custom': true,
		});

		const registry = new ImportRegistryService();

		const service = new TypescriptGeneratorEnumService(
			registry,
			testingTypescriptGeneratorConfig,
		);

		const result = service.generate([enumDef]);

		expect(result.length).toBe(1);

		const file = result[0]!;

		const model: ITsEnum = {
			name: 'EnumName',
			isStringlyTyped: false,
			entries: [
				{ name: 'entry1', value: 1 },
				{ name: 'entry2', value: 2 },
			],
			deprecated: false,
			description: undefined,
			extensions: { 'x-custom': true },
		};

		expect(file.path).toStrictEqual('enums/enum-name');
		expect(file.template).toStrictEqual('enum');
		expect(file.templateData?.model).toStrictEqual(model);
		expect(file.templateData?.jsdoc).toBeTruthy();

		expect(importRegistryServiceMock.prototype.createLink).toHaveBeenCalledTimes(1);
	});
});
