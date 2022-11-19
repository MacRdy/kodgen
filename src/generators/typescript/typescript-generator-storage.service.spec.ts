import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';

describe('typescript-generator-storage', () => {
	it('should store set records correcly', () => {
		const service = new TypescriptGeneratorStorageService();

		expect(service.getSummary()).toStrictEqual([]);

		const enumDef = new EnumDef('enumDef', 'integer', []);

		expect(service.get(enumDef)).toBeUndefined();

		service.set(enumDef, { name: 'test' });
		expect(service.get(enumDef)).toStrictEqual({ name: 'test', generated: undefined });

		service.set(enumDef, { name: 'test1', generatedModel: [] });
		expect(service.get(enumDef)).toStrictEqual({ name: 'test1', generated: [] });

		expect(service.getSummary()).toStrictEqual([{ name: 'test1', generated: [] }]);
	});
});
