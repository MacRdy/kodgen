import {
	PathDef,
	PathParametersObjectModelDef,
	PathRequestBody,
	PathResponse,
	QueryParametersObjectModelDef,
} from '@core/entities/schema-entities/path-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { SchemaEntity } from '@core/entities/shared.model';
import { OpenAPIV3 } from 'openapi-types';
import { ParserRepositoryService } from '../parser-repository.service';
import { V3ParserPathService } from './v3-parser-path.service';

jest.mock('../parser-repository.service');

const repositoryMock = jest.mocked(ParserRepositoryService);

const parseSchemaEntity = jest.fn<SchemaEntity, []>();

describe('parser-path', () => {
	beforeEach(() => {
		repositoryMock.mockClear();
		parseSchemaEntity.mockClear();
	});

	it('should create path model with only response', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserPathService(repository, parseSchemaEntity);

		const pathItem: OpenAPIV3.PathItemObject = {
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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('integer', 'int32'));

		const result = service.parse('/api', pathItem);

		expect(repositoryMock.mock.instances[0]?.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const responses: PathResponse[] = [
			new PathResponse('200', 'application/json', new SimpleModelDef('integer', 'int32')),
		];

		const tags: string[] = ['tag1'];

		const expected = new PathDef(
			'/api',
			'GET',
			undefined,
			undefined,
			undefined,
			responses,
			tags,
			true,
			['summary1', 'summary2'],
			['description1', 'description2'],
			{ 'x-custom': true },
		);

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with parameters', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserPathService(repository, parseSchemaEntity);

		const pathItem: OpenAPIV3.PathItemObject = {
			get: {
				responses: {},
				parameters: [
					{
						name: 'path1',
						in: 'path',
						schema: {
							type: 'integer',
							format: 'int32',
							nullable: true,
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

		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('integer', 'int32'));
		parseSchemaEntity.mockReturnValueOnce(new SimpleModelDef('string'));

		const result = service.parse('/api', pathItem);

		expect(repositoryMock.mock.instances[0]?.addEntity).toHaveBeenCalledTimes(2);
		expect(parseSchemaEntity).toHaveBeenCalledTimes(2);

		const pathParametersObject = new PathParametersObjectModelDef(
			'/api get Request Path Parameters',
			[new Property('path1', new SimpleModelDef('integer', 'int32'), true, true)],
		);

		const queryParametersObject = new QueryParametersObjectModelDef(
			'/api get Request Query Parameters',
			[new Property('query1', new SimpleModelDef('string'))],
		);

		const expected = new PathDef(
			'/api',
			'GET',
			pathParametersObject,
			queryParametersObject,
			undefined,
			undefined,
			undefined,
		);

		expect(result).toStrictEqual([expected]);
	});

	it('should create path model with request body', () => {
		const repository = new ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>();
		const service = new V3ParserPathService(repository, parseSchemaEntity);

		const pathItem: OpenAPIV3.PathItemObject = {
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

		const result = service.parse('/api', pathItem);

		expect(repositoryMock.mock.instances[0]?.addEntity).not.toHaveBeenCalled();
		expect(parseSchemaEntity).toHaveBeenCalledTimes(1);

		const requestBodyObject = new PathRequestBody(
			'application/json',
			new SimpleModelDef('string'),
		);

		const expected = new PathDef(
			'/api',
			'GET',
			undefined,
			undefined,
			[requestBodyObject],
			undefined,
			undefined,
		);

		expect(result).toStrictEqual([expected]);
	});
});
