import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { Model } from '../../../core/entities/shared.model';
import { ObjectModel } from '../../entities/model/object-model.model';
import { Property } from '../../entities/model/property.model';
import { SimpleModel } from '../../entities/model/simple-model.model';
import { VoidModel } from '../../entities/model/void-model.model';
import {
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	PathRequestBody,
	PathResponse,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '../../entities/path.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { CommonServicePathService } from './common-parser-path.service';

const repositoryGetInstanceSpy = jest.spyOn(ParserRepositoryService, 'getInstance');

const getMockedRepositoryInstance = () =>
	({
		addEntity: jest.fn(),
		getAllEntities: jest.fn(),
		getEntity: jest.fn(),
		hasSource: jest.fn(),
	}) as unknown as ParserRepositoryService<unknown>;

const parseSchemaEntity = jest.fn<Model, []>();

describe('common-parser-path-service', () => {
	beforeEach(() => {
		repositoryGetInstanceSpy.mockReset();
		parseSchemaEntity.mockReset();
	});

	afterEach(() => {
		repositoryGetInstanceSpy.mockRestore();
	});

	it('should create path model with only response', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const pathItem: OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject = {
			get: {
				responses: {
					'200': {
						description: 'description',
						content: {
							'application/json': {
								schema: {
									type: 'integer',
									format: 'int32',
								},
							},
						},
					},
					default: {
						description: 'default description',
					},
				},
				operationId: 'operationId',
				tags: ['tag1'],
				summary: 'summary2',
				description: 'description2',
				deprecated: true,
			},
			summary: 'summary1',
			description: 'description1',
		};

		(pathItem.get as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('integer', { format: 'int32' }));

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const responses: PathResponse[] = [
			new PathResponse('200', new SimpleModel('integer', { format: 'int32' }), {
				media: 'application/json',
				description: 'description',
			}),
			new PathResponse('default', new VoidModel(), {
				description: 'default description',
			}),
		];

		const tags: string[] = ['tag1'];

		const expected = new Path('/api', 'GET', {
			responses,
			tags,
			deprecated: true,
			operationId: 'operationId',
			summaries: ['summary1', 'summary2'],
			descriptions: ['description1', 'description2'],
			extensions: { 'x-custom': true },
		});

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with parameters', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const pathItem: OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject = {
			get: {
				responses: {},
				parameters: [
					{
						name: 'path1',
						in: 'path',
						schema: {
							type: 'integer',
							format: 'int32',
						},
						required: true,
					},
					{
						name: 'query1',
						in: 'query',
						schema: {
							type: 'string',
						},
					},
					{
						name: 'query2',
						in: 'query',
						content: {
							'application/json': {
								schema: {
									type: 'boolean',
								},
							},
						},
					},
				],
			},
		};

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('integer', { format: 'int32' }));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('string'));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('boolean'));

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(repository.addEntity).toHaveBeenCalledTimes(0);
		expect(parseSchemaEntity).toHaveBeenCalledTimes(3);

		const pathParametersObject = new ObjectModel('get /api', {
			properties: [
				new Property('path1', new SimpleModel('integer', { format: 'int32' }), {
					required: true,
				}),
			],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryParametersObject = new ObjectModel('get /api', {
			properties: [
				new Property('query1', new SimpleModel('string')),
				new Property('query2', new SimpleModel('boolean')),
			],
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const expected = new Path('/api', 'GET', {
			requestPathParameters: pathParametersObject,
			requestQueryParameters: queryParametersObject,
		});

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with request body', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const pathItem: OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject = {
			get: {
				responses: {},
				requestBody: {
					content: {
						'application/json': {
							schema: {
								type: 'string',
							},
						},
					},
				},
			},
		};

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('string'));

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const requestBodyObject = new PathRequestBody(
			'application/json',
			new SimpleModel('string'),
		);

		const expected = new Path('/api', 'GET', {
			requestBodies: [requestBodyObject],
		});

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with form data', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const multipartSchema: Model = {
			type: 'object',
			properties: {
				fileContent: {
					type: 'file',
					format: 'binary',
				},
			},
		};

		const pathItem: OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject = {
			get: {
				responses: {},
				requestBody: {
					content: {
						'multipart/form-data': {
							schema: multipartSchema,
						} as OpenAPIV3.SchemaObject,
					},
				},
			},
		};

		parseSchemaEntity.mockReturnValueOnce(
			new ObjectModel('FormDataObject', {
				properties: [
					new Property('fileContent', new SimpleModel('file', { format: 'binary' })),
				],
				origin: FORM_DATA_OBJECT_ORIGIN,
			}),
		);

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		expect(parseSchemaEntity).toBeCalledWith(multipartSchema, {
			name: 'get /api',
			origin: FORM_DATA_OBJECT_ORIGIN,
		});

		const requestBodyObject = new PathRequestBody(
			'multipart/form-data',
			new ObjectModel('FormDataObject', {
				properties: [
					new Property('fileContent', new SimpleModel('file', { format: 'binary' })),
				],
				origin: FORM_DATA_OBJECT_ORIGIN,
			}),
		);

		const expected = new Path('/api', 'GET', {
			requestBodies: [requestBodyObject],
		});

		expect(result).toStrictEqual([expected]);
	});
});
