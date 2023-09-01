import { OpenAPIV2 } from 'openapi-types';
import { ObjectModel } from '../../entities/model/object-model.model';
import { Property } from '../../entities/model/property.model';
import { SimpleModel } from '../../entities/model/simple-model.model';
import {
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	PathRequestBody,
	PathResponse,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '../../entities/path.model';
import { Model } from '../../entities/shared.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { V2ParserPathService } from './v2-parser-path.service';

jest.mock('../parser-repository.service');

const repositoryGetInstanceSpy = jest.spyOn(ParserRepositoryService, 'getInstance');

const getMockedRepositoryInstance = () =>
	({
		addEntity: jest.fn(),
		getAllEntities: jest.fn(),
		getEntity: jest.fn(),
		hasSource: jest.fn(),
	}) as unknown as ParserRepositoryService<unknown>;

const parseSchemaEntity = jest.fn<Model, []>();

describe('v2-parser-path-service', () => {
	beforeEach(() => {
		repositoryGetInstanceSpy.mockReset();
		parseSchemaEntity.mockReset();
	});

	it('should create path model with only response', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const pathItem: OpenAPIV2.PathItemObject = {
			get: {
				responses: {
					'200': {
						schema: {
							type: 'integer',
							format: 'int32',
						},
						description: 'Response 1',
					},
				},
				operationId: 'operationId',
				produces: ['application/json'],
				tags: ['tag1'],
				summary: 'summary',
				description: 'description',
				deprecated: true,
			},
		};

		(pathItem.get as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('integer', { format: 'int32' }));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

		expect(repository.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const responses: PathResponse[] = [
			new PathResponse('200', new SimpleModel('integer', { format: 'int32' }), {
				media: 'application/json',
				description: 'Response 1',
			}),
		];

		const tags: string[] = ['tag1'];

		const expected = new Path('/api', 'GET', {
			responses,
			tags,
			deprecated: true,
			operationId: 'operationId',
			summaries: ['summary'],
			descriptions: ['description'],
			extensions: { 'x-custom': true },
		});

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with parameters', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const pathItem: OpenAPIV2.PathItemObject = {
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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('integer', { format: 'int32' }));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('string'));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

		expect(repository.addEntity).toHaveBeenCalledTimes(2);
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const pathParametersObject = new ObjectModel('get /api', {
			properties: [
				new Property('path1', new SimpleModel('integer', { format: 'int32' }), {
					required: true,
				}),
			],
			origin: PATH_PARAMETERS_OBJECT_ORIGIN,
		});

		const queryParametersObject = new ObjectModel('get /api', {
			properties: [new Property('query1', new SimpleModel('string'))],
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

		const pathItem: OpenAPIV2.PathItemObject = {
			get: {
				responses: {},
				consumes: ['application/json'],
				parameters: [
					{
						in: 'body',
						name: 'body',
						schema: {
							type: 'string',
						},
					},
				],
			},
		};

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('string'));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

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

	it('should create path model with form data body', () => {
		const repository = getMockedRepositoryInstance();
		repositoryGetInstanceSpy.mockReturnValue(repository);

		const pathItem: OpenAPIV2.PathItemObject = {
			get: {
				responses: {},
				consumes: ['multipart/form-data'],
				parameters: [
					{
						name: 'additionalMetadata',
						in: 'formData',
						description: 'Additional data to pass to server',
						required: true,
						type: 'string',
					},
					{
						in: 'formData',
						name: 'file',
						description: 'file to upload',
						required: false,
						type: 'file',
					},
				],
			},
		};

		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('string'));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModel('file'));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

		expect(repository.addEntity).toHaveBeenCalledTimes(1);
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const requestBodyObject = new PathRequestBody(
			'multipart/form-data',
			new ObjectModel('get /api', {
				properties: [
					new Property('additionalMetadata', new SimpleModel('string'), {
						description: 'Additional data to pass to server',
						required: true,
					}),
					new Property('file', new SimpleModel('file'), {
						description: 'file to upload',
					}),
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
