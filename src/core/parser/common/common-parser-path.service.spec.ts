import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import {
	FORM_DATA_OBJECT_ORIGIN,
	PathDef,
	PathRequestBody,
	PathResponse,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '../../../core/entities/schema-entities/path-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { ModelDef } from '../../../core/entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { CommonServicePathService } from './common-parser-path.service';

const repositoryGetInstanceSpy = jest.spyOn(ParserRepositoryService, 'getInstance');

const getMockedRepositoryInstance = () =>
	({
		addEntity: jest.fn(),
		getAllEntities: jest.fn(),
		getEntity: jest.fn(),
		hasSource: jest.fn(),
	} as unknown as ParserRepositoryService<unknown>);

const parseSchemaEntity = jest.fn<ModelDef, []>();

describe('common-parser-path', () => {
	beforeEach(() => {
		repositoryGetInstanceSpy.mockClear();
		parseSchemaEntity.mockClear();
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
				},
				tags: ['tag1'],
				summary: 'summary2',
				description: 'description2',
				deprecated: true,
			},
			summary: 'summary1',
			description: 'description1',
		};

		(pathItem.get as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('integer', { format: 'int32' }));

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const responses: PathResponse[] = [
			new PathResponse(
				'200',
				'application/json',
				new SimpleModelDef('integer', { format: 'int32' }),
			),
		];

		const tags: string[] = ['tag1'];

		const expected = new PathDef('/api', 'GET', {
			responses,
			tags,
			deprecated: true,
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
				],
			},
		};

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('integer', { format: 'int32' }));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('string'));

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const pathParametersObject = new ObjectModelDef('/api get', {
			properties: [
				new Property('path1', new SimpleModelDef('integer', { format: 'int32' }), {
					required: true,
				}),
			],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryParametersObject = new ObjectModelDef('/api get', {
			properties: [new Property('query1', new SimpleModelDef('string'))],
			origin: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

		const expected = new PathDef('/api', 'GET', {
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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('string'));

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const requestBodyObject = new PathRequestBody(
			'application/json',
			new SimpleModelDef('string'),
		);

		const expected = new PathDef('/api', 'GET', {
			requestBodies: [requestBodyObject],
		});

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with form data', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const multipartSchema: ModelDef = {
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
			new ObjectModelDef('FormDataObject', {
				properties: [
					new Property('fileContent', new SimpleModelDef('file', { format: 'binary' })),
				],
				origin: FORM_DATA_OBJECT_ORIGIN,
			}),
		);

		const result = CommonServicePathService.parse(parseSchemaEntity, '/api', pathItem);

		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		expect(parseSchemaEntity).toBeCalledWith(multipartSchema, {
			name: '/api get',
			origin: FORM_DATA_OBJECT_ORIGIN,
		});

		const requestBodyObject = new PathRequestBody(
			'multipart/form-data',
			new ObjectModelDef('FormDataObject', {
				properties: [
					new Property('fileContent', new SimpleModelDef('file', { format: 'binary' })),
				],
				origin: FORM_DATA_OBJECT_ORIGIN,
			}),
		);

		const expected = new PathDef('/api', 'GET', {
			requestBodies: [requestBodyObject],
		});

		expect(result).toStrictEqual([expected]);
	});
});
