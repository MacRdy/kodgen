import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PathDef,
	PathMethod,
	PathRequestBody,
	PathResponse,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../../core/entities/schema-entities/path-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { assertUnreachable, mergeParts } from '../../../core/utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	getExtensions,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	schemaWarning,
	TrivialError,
	UnresolvedReferenceError,
} from '../parser.model';
import {
	OpenApiParameterObject,
	OpenApiReferenceObject,
	OpenApiV3xMediaTypeObject,
	OpenApiV3xOperationObject,
	OpenApiV3xParameterObject,
	OpenApiV3xPathItemObject,
	OpenApiV3xReferenceObject,
	OpenApiV3xResponseObject,
	OpenApiV3xSchemaObject,
} from './common-parser.model';

export class CommonServicePathService {
	static parse<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		path: OpenApiV3xPathItemObject,
	): PathDef[] {
		const repository = ParserRepositoryService.getInstance<T>();

		const paths: PathDef[] = [];

		for (const method of Object.values(OpenAPIV3.HttpMethods)) {
			const data: OpenApiV3xOperationObject | undefined = path[method];

			if (!data) {
				continue;
			}

			const allParameters = this.getAllRequestParameters(
				path.parameters ?? [],
				data.parameters ?? [],
			);

			const requestPathParameters = this.getRequestParameters(
				repository,
				parseSchemaEntity,
				pattern,
				method,
				allParameters,
				'path',
			);

			const requestQueryParameters = this.getRequestParameters(
				repository,
				parseSchemaEntity,
				pattern,
				method,
				allParameters,
				'query',
			);

			const responses = this.getResponses(parseSchemaEntity, pattern, method, data);

			const requestBody = this.getRequestBody(parseSchemaEntity, pattern, method, data);

			const pathDef = new PathDef(pattern, this.mapMethodToInternal(method), {
				requestBody,
				requestPathParameters,
				requestQueryParameters,
				responses,
				deprecated: data.deprecated,
				tags: data.tags,
				descriptions: this.collectPathInfo(path, data, x => x.description),
				summaries: this.collectPathInfo(path, data, x => x.summary),
				extensions: getExtensions(data),
			});

			paths.push(pathDef);
		}

		return paths;
	}

	private static collectPathInfo(
		path: OpenApiV3xPathItemObject,
		data: OpenApiV3xOperationObject,
		selector: (
			from: OpenApiV3xPathItemObject | OpenApiV3xOperationObject,
		) => string | undefined,
	): string[] | undefined {
		const result: string[] = [];

		const pathText = selector(path);
		const dataText = selector(data);

		if (pathText) {
			result.push(pathText);
		}

		if (dataText) {
			result.push(dataText);
		}

		return result.length ? result : undefined;
	}

	static getAllRequestParameters(
		commonParameters: (OpenApiParameterObject | OpenApiReferenceObject)[],
		concreteParameters: (OpenApiParameterObject | OpenApiReferenceObject)[],
	): OpenApiParameterObject[] {
		if (
			commonParameters.some(isOpenApiReferenceObject) ||
			concreteParameters.some(isOpenApiReferenceObject)
		) {
			throw new UnresolvedReferenceError();
		}

		const allParameters = [
			...commonParameters,
			...concreteParameters,
		] as OpenApiParameterObject[];

		const params = allParameters.reduce<Record<string, OpenApiParameterObject>>(
			(acc, param) => ({ ...acc, [`${param.name}@${param.in}`]: param }),
			{},
		);

		return Object.values(params);
	}

	private static getRequestParameters<T extends OpenApiV3xSchemaObject>(
		repository: ParserRepositoryService<T>,
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		method: string,
		parameters: OpenApiV3xParameterObject[],
		parametersType: 'path' | 'query',
	): ObjectModelDef | undefined {
		const origin =
			parametersType === 'path'
				? PATH_PARAMETERS_OBJECT_ORIGIN
				: QUERY_PARAMETERS_OBJECT_ORIGIN;

		const properties: Property[] = [];

		for (const param of parameters) {
			try {
				if (isOpenApiReferenceObject(param.schema)) {
					throw new UnresolvedReferenceError();
				}

				if (param.in !== parametersType) {
					continue;
				}

				if (!param.schema) {
					throw new TrivialError('Schema not defined.');
				}

				const propDef = parseSchemaEntity(param.schema as T, {
					name: mergeParts(pattern, method, param.name),
					origin,
				});

				const prop = new Property(param.name, propDef, {
					deprecated: param.schema.deprecated,
					description: param.schema.description,
					readonly: param.schema.readOnly,
					writeonly: param.schema.writeOnly,
					required: param.required,
				});

				properties.push(prop);
			} catch (e: unknown) {
				if (e instanceof TrivialError) {
					schemaWarning([pattern, param.name], e);
				} else {
					throw e;
				}
			}
		}

		if (!properties.length) {
			return undefined;
		}

		const modelDef = new ObjectModelDef(mergeParts(pattern, method), {
			properties,
			origin,
		});

		repository.addEntity(modelDef);

		return modelDef;
	}

	private static getRequestBody<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		method: string,
		data: OpenApiV3xOperationObject,
	): PathRequestBody[] | undefined {
		const requestBodies: PathRequestBody[] = [];

		if (data.requestBody) {
			if (isOpenApiReferenceObject(data.requestBody)) {
				throw new UnresolvedReferenceError();
			}

			for (const [media, content] of Object.entries<
				OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject
			>(data.requestBody.content)) {
				if (content?.schema) {
					if (isOpenApiReferenceObject(content.schema)) {
						throw new UnresolvedReferenceError();
					}

					const entityName = mergeParts(pattern, method);

					const body = this.createPathBody(
						parseSchemaEntity,
						media,
						entityName,
						content.schema as T,
					);

					requestBodies.push(body);
				}
			}
		}

		return requestBodies.length ? requestBodies : undefined;
	}

	private static createPathBody<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		media: string,
		name: string,
		schema: T,
	): PathRequestBody {
		const entity = parseSchemaEntity(schema, {
			name,
			origin: media === 'multipart/form-data' ? FORM_DATA_OBJECT_ORIGIN : BODY_OBJECT_ORIGIN,
		});

		return new PathRequestBody(media, entity);
	}

	private static getResponses<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		method: string,
		data: OpenApiV3xOperationObject,
	): PathResponse[] | undefined {
		const responses: PathResponse[] = [];

		for (const [code, res] of Object.entries<
			OpenApiV3xResponseObject | OpenApiV3xReferenceObject
		>(data.responses ?? [])) {
			if (isOpenApiReferenceObject(res)) {
				throw new UnresolvedReferenceError();
			}

			if (!res.content) {
				continue;
			}

			for (const [media, content] of Object.entries<OpenApiV3xMediaTypeObject>(res.content)) {
				if (content?.schema) {
					const response = this.getPathResponse(
						parseSchemaEntity,
						content.schema,
						pattern,
						method,
						code,
						media,
					);

					responses.push(response);
				}
			}
		}

		return responses.length ? responses : undefined;
	}

	private static getPathResponse<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		schema: OpenApiV3xSchemaObject | OpenApiV3xReferenceObject,
		pattern: string,
		method: string,
		code: string,
		media: string,
	): PathResponse {
		if (isOpenApiReferenceObject(schema)) {
			throw new UnresolvedReferenceError();
		}

		const entityName = mergeParts(pattern, method, code);

		const entity = parseSchemaEntity(schema as T, {
			name: entityName,
			origin: RESPONSE_OBJECT_ORIGIN,
		});

		return new PathResponse(code, media, entity);
	}

	private static mapMethodToInternal(value: OpenAPIV3.HttpMethods): PathMethod {
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
