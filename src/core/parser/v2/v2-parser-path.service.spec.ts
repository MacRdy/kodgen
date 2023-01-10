import { OpenAPIV2 } from 'openapi-types';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
import {
	FORM_DATA_OBJECT_ORIGIN,
	PathDef,
	PathRequestBody,
	PathResponse,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
} from '../../entities/schema-entities/path-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { SimpleModelDef } from '../../entities/schema-entities/simple-model-def.model';
import { ModelDef } from '../../entities/shared.model';
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
	} as unknown as ParserRepositoryService<unknown>);

const parseSchemaEntity = jest.fn<ModelDef, []>();

describe('v2-parser-path', () => {
	beforeEach(() => {
		repositoryGetInstanceSpy.mockClear();
		parseSchemaEntity.mockClear();
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
				produces: ['application/json'],
				tags: ['tag1'],
				summary: 'summary',
				description: 'description',
				deprecated: true,
			},
		};

		(pathItem.get as Record<string, unknown>)['x-custom'] = true;

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('integer', { format: 'int32' }));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('integer', { format: 'int32' }));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('string'));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

		expect(repository.addEntity).toHaveBeenCalledTimes(2);
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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('string'));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('string'));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('file'));

		const result = new V2ParserPathService(parseSchemaEntity).parse('/api', pathItem);

		expect(repository.addEntity).toHaveBeenCalledTimes(1);
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const requestBodyObject = new PathRequestBody(
			'multipart/form-data',
			new ObjectModelDef('/api get', {
				properties: [
					new Property('additionalMetadata', new SimpleModelDef('string'), {
						description: 'Additional data to pass to server',
						required: true,
					}),
					new Property('file', new SimpleModelDef('file'), {
						description: 'file to upload',
					}),
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
