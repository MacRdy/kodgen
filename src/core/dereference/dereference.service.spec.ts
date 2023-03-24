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

	beforeEach(() => {
		loadService.load.mockClear();
		loadService.normalizePath.mockClear();
	});

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(1);

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(1);

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(1);

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(1);

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(1);

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(1);

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

		loadService.normalizePath.mockReturnValueOnce('swagger.json');
		loadService.normalizePath.mockReturnValueOnce('external.json');
		loadService.load.mockResolvedValueOnce(externalObj);

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(2);
		expect(loadService.load).toBeCalledWith('external.json');

		expect(obj.model2).toBe(externalObj);
		expect(obj.model3).toBe(externalObj);
		expect(obj.model4).toBe(obj.model1);
	});

	it('should resolve complex external references', async () => {
		const obj = {
			model1: { $ref: 'external1.json' },
			model2: { $ref: 'external2.json' },
			model3: { $ref: 'external3.json' },
		};

		const externalObj1 = { type: 'type1' };

		const externalObj2 = {
			type: 'type2',
			ext: { $ref: 'external4.json' },
			typeAlias: { $ref: '#/type' },
		};

		const externalObj3 = { type: 'type3' };

		const externalObj4 = { type: 'type4' };

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		loadService.normalizePath.mockReturnValueOnce('external1.json');
		loadService.load.mockResolvedValueOnce(externalObj1);

		loadService.normalizePath.mockReturnValueOnce('external2.json');
		loadService.load.mockResolvedValueOnce(externalObj2);

		loadService.normalizePath.mockReturnValueOnce('external4.json');
		loadService.load.mockResolvedValueOnce(externalObj4);

		loadService.normalizePath.mockReturnValueOnce('external3.json');
		loadService.load.mockResolvedValueOnce(externalObj3);

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(5);

		expect(loadService.load).toBeCalledTimes(4);
		expect(loadService.load).nthCalledWith(1, 'external1.json');
		expect(loadService.load).nthCalledWith(2, 'external2.json');
		expect(loadService.load).nthCalledWith(3, 'external4.json');
		expect(loadService.load).nthCalledWith(4, 'external3.json');

		expect(obj).toStrictEqual({
			model1: { type: 'type1' },
			model2: { type: 'type2', ext: { type: 'type4' }, typeAlias: 'type2' },
			model3: { type: 'type3' },
		});
	});

	it('should resolve inner reference to initial file', async () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: 'dir1/external1.json' },
		};

		const external1Obj = { $ref: 'dir2/external2.json' };
		const external2Obj = { $ref: '../../swagger.json' };

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		loadService.normalizePath.mockReturnValueOnce('dir1/external1.json');
		loadService.load.mockResolvedValueOnce(external1Obj);

		loadService.normalizePath.mockReturnValueOnce('dir1/dir2/external2.json');
		loadService.load.mockResolvedValueOnce(external2Obj);

		loadService.normalizePath.mockReturnValueOnce('swagger.json');

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(4);

		expect(loadService.load).toBeCalledTimes(2);
		expect(loadService.load).nthCalledWith(1, 'dir1/external1.json');
		expect(loadService.load).nthCalledWith(2, 'dir1/dir2/external2.json');

		expect(obj.model2).toBe(obj);
	});

	it('should resolve external reference with keys', async () => {
		const obj = {
			model1: { type: 'integer' },
			model2: { $ref: 'external.json#/obj2' },
		};

		const externalObj = { obj1: {}, obj2: { type: 'string' } };

		loadService.normalizePath.mockReturnValueOnce('swagger.json');
		loadService.normalizePath.mockReturnValueOnce('external.json');
		loadService.load.mockResolvedValueOnce(externalObj);

		await service.dereference(obj, 'swagger.json');

		expect(loadService.normalizePath).toBeCalledTimes(2);
		expect(loadService.load).toBeCalledWith('external.json');

		expect(obj.model2).toBe(externalObj.obj2);
	});
});
