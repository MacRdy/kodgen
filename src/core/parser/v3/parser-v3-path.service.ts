import { OpenAPIV3 } from 'openapi-types';
import {
	BaseModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModelDef,
} from '../../entities/model.model';
import {
	PathDef,
	PathMethod,
	PathParameterModelDef,
	PathRequestBody,
	PathResponse,
} from '../../entities/path.model';
import { SchemaEntity } from '../../entities/shared.model';
import { toPascalCase } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import { isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './parser-v3.model';

export class ParserV3PathService {
	private readonly httpMethods: ReadonlyArray<OpenAPIV3.HttpMethods> = [
		OpenAPIV3.HttpMethods.GET,
		OpenAPIV3.HttpMethods.POST,
		OpenAPIV3.HttpMethods.PUT,
		OpenAPIV3.HttpMethods.DELETE,
	];

	// TODO regex
	private readonly httpStatusCodes: ReadonlyArray<string> = ['200'];

	// TODO
	// /^(application/json|[^;/ \t]+/[^;/ \t]+[+]json)[ \t]*(;.*)?$/i
	// application/json-patch+json
	private readonly requestBodyMediaTypes: ReadonlyArray<string> = ['application/json'];

	private readonly responseMediaTypes: ReadonlyArray<string> = ['application/json'];

	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(pattern: string, path: OpenAPIV3.PathItemObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const method of this.httpMethods) {
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
			);

			paths.push(pathDef);
		}

		return paths;
	}

	private getRequestParameters(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
		parametersType: 'path' | 'query',
	): ObjectModelDef<PathParameterModelDef> | undefined {
		const properties: PathParameterModelDef[] = [];

		if (data.parameters) {
			for (const param of data.parameters) {
				if (isOpenApiV3ReferenceObject(param)) {
					throw new Error('Unsupported parameter reference.');
				}

				if (param.in !== parametersType) {
					continue;
				}

				if (!param.schema) {
					throw new Error('Parameter schema is not defined.');
				}

				if (isOpenApiV3ReferenceObject(param.schema)) {
					throw new Error('Unresolved schema reference.');
				}

				const entity = this.parseSchemaEntity(param.name, param.schema, param.required);

				if (
					!(entity instanceof PrimitiveModelDef) &&
					!(entity instanceof ReferenceModelDef)
				) {
					throw new Error('Unexpected entity type.');
				}

				properties.push(entity);
			}
		}

		if (!properties.length) {
			return undefined;
		}

		const modelDef = new ObjectModelDef(
			toPascalCase(`${pattern} ${method} ${parametersType}Parameters`),
			properties,
			true,
			false,
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
				throw new Error('Unsupported request body reference.');
			}

			for (const media of this.requestBodyMediaTypes) {
				const content = data.requestBody.content[media];

				if (content?.schema) {
					if (isOpenApiV3ReferenceObject(content.schema)) {
						throw new Error('Unresolved schema reference.');
					}

					const entityName = toPascalCase(pattern, method, 'Request');

					const parsedEntity = this.parseSchemaEntity(
						entityName,
						content.schema,
						data.requestBody.required,
					);

					const entity =
						parsedEntity instanceof ReferenceModelDef ? parsedEntity.def : parsedEntity;

					if (!(entity instanceof ObjectModelDef)) {
						throw new Error('Unexpected entity type.');
					}

					const requestBody = new PathRequestBody(media, entity);

					requestBodies.push(requestBody);
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
			if (!this.httpStatusCodes.includes(code)) {
				continue;
			}

			if (isOpenApiV3ReferenceObject(res)) {
				throw new Error('Unsupported response reference.');
			}

			if (!res.content) {
				continue;
			}

			for (const media of this.responseMediaTypes) {
				const content = res.content[media];

				if (content?.schema) {
					if (isOpenApiV3ReferenceObject(content.schema)) {
						throw new Error('Unresolved schema reference.');
					}

					const entityName = toPascalCase(pattern, method, code, 'Response');

					const parsedEntity = this.parseSchemaEntity(entityName, content.schema);

					const entity =
						parsedEntity instanceof ReferenceModelDef ? parsedEntity.def : parsedEntity;

					if (!(entity instanceof BaseModelDef)) {
						throw new Error('Unexpected entity type.');
					}

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
			default:
				throw new Error('Unsupported http method.');
		}
	}
}
