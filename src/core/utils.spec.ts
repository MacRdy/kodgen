import { EnumModelDef } from './entities/schema-entities/enum-model-def.model';
import { ExtendedModelDef } from './entities/schema-entities/extended-model-def.model';
import { NullModelDef } from './entities/schema-entities/null-model-def.model';
import { ObjectModelDef } from './entities/schema-entities/object-model-def.model';
import { ModelDef } from './entities/shared.model';
import { FileService } from './file/file.service';
import {
	getAjvValidateErrorMessage,
	loadFile,
	mergeParts,
	selectModels,
	toCamelCase,
	toKebabCase,
	toPascalCase,
} from './utils';

jest.mock('./file/file.service');

const fileServiceGlobalMock = jest.mocked(FileService);

describe('utils', () => {
	beforeEach(() => {
		fileServiceGlobalMock.mockClear();
	});

	describe('mergeParts', () => {
		it('should merge string parts with spaces', () => {
			expect(mergeParts('p1', 'p2', 'p3')).toStrictEqual('p1 p2 p3');
		});

		it('should stay all characters', () => {
			expect(mergeParts('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual(
				'!@#$%^&*()\\/,.?<>{}[];:\'"1word',
			);
		});
	});

	describe('toPascalCase', () => {
		it('should transform string parts to pascal case without spaces', () => {
			expect(toPascalCase('pascal', 'case', ' string')).toStrictEqual('PascalCaseString');
		});

		it('should remain only letters and numbers', () => {
			expect(toPascalCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	describe('toKebabCase', () => {
		it('should transform string parts to kebab case without spaces', () => {
			expect(toKebabCase('kebab', 'case', ' string')).toStrictEqual('kebab-case-string');
		});

		it('should remain only letters and numbers', () => {
			expect(toKebabCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	describe('toCamelCase', () => {
		it('should transform string parts to camel case without spaces', () => {
			expect(toCamelCase('camel', 'case', ' string')).toStrictEqual('camelCaseString');
		});

		it('should remain only letters and numbers', () => {
			expect(toCamelCase('!@#$%^&*()\\/,.?<>{}[];:\'"1word')).toStrictEqual('1word');
		});
	});

	it('should handle ajv error messages correctly', () => {
		expect(getAjvValidateErrorMessage()).toStrictEqual(
			`Invalid configuration:\n- Unknown error`,
		);

		expect(
			getAjvValidateErrorMessage([
				{
					keyword: 'keyword',
					params: {},
					schemaPath: 'schemaPath',
					instancePath: 'instancePath',
					message: 'message',
				},
			]),
		).toStrictEqual(`Invalid configuration:\n- instancePath message`);
	});

	it('should load user config', async () => {
		await expect(loadFile()).resolves.toBeUndefined();

		await expect(loadFile('path', 'Config not found')).rejects.toThrow('Config not found');

		fileServiceGlobalMock.prototype.exists.mockReturnValueOnce(true);
		fileServiceGlobalMock.prototype.loadFile.mockResolvedValueOnce({ test: true });

		await expect(loadFile('path ')).resolves.toStrictEqual({ test: true });

		const fileService = jest.mocked(fileServiceGlobalMock.mock.instances[1]);

		expect(fileService?.exists).toBeCalledWith('path');
		expect(fileService?.loadFile).toBeCalledWith('path');

		await expect(loadFile('path')).rejects.toThrow('');
	});

	it('should select models by type', () => {
		const enumModelDef = new EnumModelDef('name', 'integer', []);

		const objectModelDef1 = new ObjectModelDef('name');
		const objectModelDef2 = new ObjectModelDef('name');

		const nullModelDef = new NullModelDef();

		const extendedModelDef = new ExtendedModelDef('or', [objectModelDef2, nullModelDef]);

		const store: ModelDef[] = [
			enumModelDef,
			objectModelDef1,
			objectModelDef2,
			extendedModelDef,
		];

		const result1 = selectModels(store, EnumModelDef);
		expect(result1.length).toBe(1);
		expect(result1[0]).toBe(enumModelDef);

		const result2 = selectModels(store, ObjectModelDef);
		expect(result2.length).toBe(2);
		expect(result2[0]).toBe(objectModelDef1);
		expect(result2[1]).toBe(objectModelDef2);

		const result3 = selectModels(store, NullModelDef);
		expect(result3.length).toBe(1);
		expect(result3[0]).toBe(nullModelDef);
	});
});
