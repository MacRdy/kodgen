import { OpenAPIV3 } from 'openapi-types';
import {
	PathDef,
	PathMethod,
	PathParametersObjectModelDef,
	PathRequestBody,
	PathResponse,
	QueryParametersObjectModelDef,
} from '../../entities/schema-entities/path-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { SchemaEntity } from '../../entities/shared.model';
import { assertUnreachable, mergeParts, unresolvedSchemaReferenceError } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import { getExtensions, isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './v3-parser.model';

export class V3ParserPathService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(pattern: string, path: OpenAPIV3.PathItemObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const method of Object.values(OpenAPIV3.HttpMethods)) {
			const data: OpenAPIV3.OperationObject | undefined = path[method];

			if (!data) {
				continue;
			}

			const requestPathParameters = this.getRequestParameters(pattern, method, data, 'path');

			const requestQueryParameters = this.getRequestParameters(
				pattern,
				method,
				data,
				'query',
			);

			const responses = this.getResponses(pattern, method, data);

			const requestBody = this.getRequestBody(pattern, method, data);

			const pathDef = new PathDef(
				pattern,
				this.mapMethodToInternal(method),
				requestPathParameters,
				requestQueryParameters,
				requestBody,
				responses,
				data.tags,
				data.deprecated,
				data.description,
				getExtensions(data),
			);

			paths.push(pathDef);
		}

		return paths;
	}

	private getRequestParameters(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
		parametersType: 'path',
	): PathParametersObjectModelDef | undefined;
	private getRequestParameters(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
		parametersType: 'query',
	): QueryParametersObjectModelDef | undefined;
	private getRequestParameters(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
		parametersType: 'path' | 'query',
	): PathParametersObjectModelDef | QueryParametersObjectModelDef | undefined {
		const properties: Property[] = [];

		if (data.parameters) {
			for (const param of data.parameters) {
				if (isOpenApiV3ReferenceObject(param) || isOpenApiV3ReferenceObject(param.schema)) {
					throw unresolvedSchemaReferenceError();
				}

				if (param.in !== parametersType) {
					continue;
				}

				if (!param.schema) {
					throw new Error('Parameter schema is not defined.');
				}

				const entity = this.parseSchemaEntity(
					param.schema,
					mergeParts(pattern, method, param.name),
				);

				const ref = new Property(
					param.name,
					entity,
					param.required,
					param.schema.nullable,
					param.schema.readOnly,
					param.schema.writeOnly,
					param.schema.deprecated,
					param.schema.description,
				);

				properties.push(ref);
			}
		}

		if (!properties.length) {
			return undefined;
		}

		const modelDef =
			parametersType === 'path'
				? new PathParametersObjectModelDef(
						mergeParts(pattern, method, 'Request', 'Path', 'Parameters'),
						properties,
						data.deprecated,
						data.description,
				  )
				: new QueryParametersObjectModelDef(
						mergeParts(pattern, method, 'Request', 'Query', 'Parameters'),
						properties,
						data.deprecated,
						data.description,
				  );

		this.repository.addEntity(modelDef);

		return modelDef;
	}

	private getRequestBody(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
	): PathRequestBody[] | undefined {
		const requestBodies: PathRequestBody[] = [];

		if (data.requestBody) {
			if (isOpenApiV3ReferenceObject(data.requestBody)) {
				throw unresolvedSchemaReferenceError();
			}

			for (const [media, content] of Object.entries(data.requestBody.content)) {
				if (content?.schema) {
					if (isOpenApiV3ReferenceObject(content.schema)) {
						throw unresolvedSchemaReferenceError();
					}

					const entityName = mergeParts(pattern, method, 'Request', 'Body');
					const entity = this.parseSchemaEntity(content.schema, entityName);

					const body = new PathRequestBody(media, entity);

					requestBodies.push(body);
				}
			}
		}

		return requestBodies.length ? requestBodies : undefined;
	}

	private getResponses(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
	): PathResponse[] | undefined {
		const responses: PathResponse[] = [];

		for (const [code, res] of Object.entries(data.responses)) {
			if (isOpenApiV3ReferenceObject(res)) {
				throw new Error('Unsupported response reference.');
			}

			if (!res.content) {
				continue;
			}

			for (const [media, content] of Object.entries(res.content)) {
				if (content?.schema) {
					if (isOpenApiV3ReferenceObject(content.schema)) {
						throw unresolvedSchemaReferenceError();
					}

					const entityName = mergeParts(pattern, method, code, 'Response');
					const entity = this.parseSchemaEntity(content.schema, entityName);

					const response = new PathResponse(code, media, entity);

					responses.push(response);
				}
			}
		}

		return responses.length ? responses : undefined;
	}

	private mapMethodToInternal(value: OpenAPIV3.HttpMethods): PathMethod {
		switch (value) {
			case OpenAPIV3.HttpMethods.GET:
				return 'GET';
			case OpenAPIV3.HttpMethods.POST:
				return 'POST';
			case OpenAPIV3.HttpMethods.PUT:
				return 'PUT';
			case OpenAPIV3.HttpMethods.DELETE:
				return 'DELETE';
			case OpenAPIV3.HttpMethods.OPTIONS:
				return 'OPTIONS';
			case OpenAPIV3.HttpMethods.PATCH:
				return 'PATCH';
			case OpenAPIV3.HttpMethods.TRACE:
				return 'TRACE';
			case OpenAPIV3.HttpMethods.HEAD:
				return 'HEAD';
			default:
				return assertUnreachable(value);
		}
	}
}
