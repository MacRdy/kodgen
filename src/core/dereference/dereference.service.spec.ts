import { LoadService } from '../load/load.service';
import {
	DEREFERENCE_RESOLVED_VALUE,
	getDereferenceResolvedValueOrDefault,
} from './dereference.model';
import { DereferenceService } from './dereference.service';

jest.mock('../load/load.service');

describe('dereference-service', () => {
	const loadService = jest.mocked(new LoadService());
	const service = new DereferenceService(loadService);

	it('should resolve simple reference', async () => {
		const obj = {
			model1: {
				type: 'object',
				properties: {
					prop: { $ref: '#/model2' },
				},
			},
			model2: {
				type: 'object',
				properties: {
					prop: { type: 'boolean' },
				},
			},
		};

		await service.dereference(obj, 'swagger.json');

		expect(obj.model1.properties.prop).toBe(obj.model2);
	});

	it('should resolve reference with extras', async () => {
		const obj = {
			model1: {
				type: 'object',
				properties: {
					prop: { $ref: '#/model2', description: 'extra' },
				},
			},
			model2: {
				type: 'object',
				description: 'description',
				specialProp: true,
				properties: {
					prop: { type: 'boolean' },
				},
			},
		};

		await service.dereference(obj, 'swagger.json');

		expect(obj.model1.properties.prop).not.toBe(obj.model2);

		expect(obj.model1.properties.prop.$ref).toBeUndefined();
		expect(obj.model1.properties.prop.description).toStrictEqual('extra');
		expect((obj.model1.properties.prop as Record<string, unknown>).specialProp).toBeTruthy();
	});

	it('should resolve circular reference', async () => {
		const obj = {
			model: {
				type: 'object',
				properties: {
					prop: { $ref: '#/model' },
				},
			},
		};

		await service.dereference(obj, 'swagger.json');

		expect(obj.model.properties.prop).toBe(obj.model);
	});

	it('should return resolved value if exists', () => {
		const original = { original: true };

		const a = {
			[DEREFERENCE_RESOLVED_VALUE]: original,
			original: false,
		};

		const b = { original: false };

		expect(getDereferenceResolvedValueOrDefault(a)).toBe(original);

		expect(getDereferenceResolvedValueOrDefault(b)).toBe(b);
	});

	it('should remain not dereferenced', async () => {
		const obj = {
			model1: { $ref: '#/model2' },
			model2: { $ref: '#/model3' },
			model3: { $ref: '#/model0' },
		};

		await service.dereference(obj, 'swagger.json');

		expect(obj.model1).toStrictEqual({ $ref: '#/model0' });
		expect(obj.model2).toStrictEqual({ $ref: '#/model0' });
		expect(obj.model3).toStrictEqual({ $ref: '#/model0' });
	});

	it('should resolve indirect references', async () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: '#/model3' },
			model3: { $ref: '#/model4' },
			model4: { $ref: '#/model1' },
		};

		await service.dereference(obj, 'swagger.json');

		expect(obj.model2).toBe(obj.model1);
		expect(obj.model3).toBe(obj.model1);
		expect(obj.model4).toBe(obj.model1);
	});

	it('should resolve direct references', async () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: '#/model1' },
			model3: { $ref: '#/model2' },
			model4: { $ref: '#/model3' },
		};

		await service.dereference(obj, 'swagger.json');

		expect(obj.model2).toBe(obj.model1);
		expect(obj.model3).toBe(obj.model1);
		expect(obj.model4).toBe(obj.model1);
	});

	it('should resolve external reference', async () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: '#/model3' },
			model3: { $ref: 'external.json' },
			model4: { $ref: '#/model1' },
		};

		const externalObj = { type: 'string' };

		loadService.load.mockResolvedValueOnce(externalObj);

		await service.dereference(obj, 'swagger.json');

		expect(obj.model2).toBe(externalObj);
		expect(obj.model3).toBe(externalObj);
		expect(obj.model4).toBe(obj.model1);
	});
});
