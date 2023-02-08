import { DereferenceService } from './dereference.service';

describe('dereference', () => {
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
});
