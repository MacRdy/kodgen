import { OpenAPIV3 } from 'openapi-types';
import { SchemaEntity } from 'src/core/document.model';
import { ModelDef } from '../entities/model.model';
import { Method, PathDef, PathRequestBody, PathResponse } from '../entities/path.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { generateName } from '../parser.model';
import { isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './parser-v3.model';

export class ParserV3PathService {
	private readonly httpMethods: ReadonlyArray<OpenAPIV3.HttpMethods> = [
		OpenAPIV3.HttpMethods.GET,
		OpenAPIV3.HttpMethods.POST,
		OpenAPIV3.HttpMethods.PUT,
		OpenAPIV3.HttpMethods.DELETE,
	];

	private readonly httpStatusCodes: string[] = ['200'];

	private readonly requestBodyMediaTypes: string[] = ['application/json'];

	private readonly responseMediaTypes: string[] = ['application/json'];

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

			const parameters = this.getParameters(data);
			const responses = this.getResponses(pattern, method, data);
			const requestBody = this.getRequestBody(pattern, method, data);

			const pathDef = new PathDef(
				pattern,
				this.mapMethodToInternal(method),
				parameters,
				requestBody,
				responses,
				data.tags,
			);

			paths.push(pathDef);
		}

		console.log(path);

		return paths;
	}

	private getParameters(data: OpenAPIV3.OperationObject): ModelDef[] | undefined {
		const parameters: ModelDef[] = [];

		if (data.parameters) {
			for (const param of data.parameters) {
				if (isOpenApiV3ReferenceObject(param)) {
					throw new Error('Unsupported parameter reference.');
				}

				if (!param.schema) {
					throw new Error('Parameter schema is not defined.');
				}

				const schemaEntity = this.parseSchemaEntity(
					param.name,
					param.schema,
					param.required,
				);

				parameters.push(schemaEntity);
			}
		}

		return parameters.length ? parameters : undefined;
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
					const schemaEntityName = generateName([pattern, method, 'Request']);

					const schemaEntity = this.parseSchemaEntity(
						schemaEntityName,
						content.schema,
						data.requestBody.required,
					);

					const requestBody = new PathRequestBody(media, schemaEntity);

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
					const schemaEntityName = generateName([pattern, method, code, 'Response']);

					const schemaEntity = this.parseSchemaEntity(schemaEntityName, content.schema);

					const response = new PathResponse(code, media, schemaEntity);

					responses.push(response);
				}
			}
		}

		return responses.length ? responses : undefined;
	}

	private mapMethodToInternal(value: OpenAPIV3.HttpMethods): Method {
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
