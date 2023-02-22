import {
	DEREFERENCE_RESOLVED_VALUE,
	getDereferenceResolvedValueOrDefault,
} from './dereference.model';
import { DereferenceService } from './dereference.service';

describe('dereference-service', () => {
	const service = new DereferenceService();

	it('should resolve simple reference', () => {
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

		service.dereference(obj);

		expect(obj.model1.properties.prop).toBe(obj.model2);
	});

	it('should resolve reference with extras', () => {
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

		service.dereference(obj);

		expect(obj.model1.properties.prop).not.toBe(obj.model2);

		expect(obj.model1.properties.prop.$ref).toBeUndefined();
		expect(obj.model1.properties.prop.description).toStrictEqual('extra');
		expect((obj.model1.properties.prop as Record<string, unknown>).specialProp).toBeTruthy();
	});

	it('should resolve circular reference', () => {
		const obj = {
			model: {
				type: 'object',
				properties: {
					prop: { $ref: '#/model' },
				},
			},
		};

		service.dereference(obj);

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

	it('should remain not dereferenced', () => {
		const obj = {
			model1: { $ref: '#/model2' },
			model2: { $ref: '#/model3' },
			model3: { $ref: '#/model0' },
		};

		service.dereference(obj);

		expect(obj.model1).toStrictEqual({ $ref: '#/model0' });
		expect(obj.model2).toStrictEqual({ $ref: '#/model0' });
		expect(obj.model3).toStrictEqual({ $ref: '#/model0' });
	});

	it('should resolve indirect references', () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: '#/model3' },
			model3: { $ref: '#/model4' },
			model4: { $ref: '#/model1' },
		};

		service.dereference(obj);

		expect(obj.model2).toBe(obj.model1);
		expect(obj.model3).toBe(obj.model1);
		expect(obj.model4).toBe(obj.model1);
	});

	it('should resolve direct references', () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: '#/model1' },
			model3: { $ref: '#/model2' },
			model4: { $ref: '#/model3' },
		};

		service.dereference(obj);

		expect(obj.model2).toBe(obj.model1);
		expect(obj.model3).toBe(obj.model1);
		expect(obj.model4).toBe(obj.model1);
	});
});
