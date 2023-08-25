import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { assertUnreachable } from '../../../core/utils';
import { ObjectModel } from '../../entities/model/object-model.model';
import { Property } from '../../entities/model/property.model';
import { UnknownModel } from '../../entities/model/unknown-model.model';
import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	PathMethod,
	PathRequestBody,
	PathResponse,
	PathSecurity,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../entities/path.model';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	DefaultError,
	ParseSchemaEntityFn,
	UnresolvedReferenceError,
	getExtensions,
	isOpenApiReferenceObject,
	schemaWarning,
} from '../parser.model';
import {
	OpenApiOperationObject,
	OpenApiParameterObject,
	OpenApiReferenceObject,
	OpenApiV3xMediaTypeObject,
	OpenApiV3xOperationObject,
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
	): Path[] {
		const paths: Path[] = [];

		const pathParameters = this.getResolvedParametersOnly(pattern, path.parameters);

		for (const method of Object.values(OpenAPIV3.HttpMethods)) {
			const data: OpenApiV3xOperationObject | undefined = path[method];

			if (!data) {
				continue;
			}

			const parameters = this.getResolvedParametersOnly(pattern, data.parameters);

			const allParameters = this.getAllRequestParameters(pathParameters, parameters);

			const requestPathParameters = this.getRequestParameters(
				parseSchemaEntity,
				pattern,
				method,
				allParameters,
				'path',
			);

			const requestQueryParameters = this.getRequestParameters(
				parseSchemaEntity,
				pattern,
				method,
				allParameters,
				'query',
			);

			const responses = this.getResponses(parseSchemaEntity, pattern, method, data);

			const requestBodies = this.getRequestBodies(parseSchemaEntity, pattern, method, data);

			const pathDef = new Path(pattern, this.mapMethodToInternal(method), {
				operationId: data.operationId,
				requestBodies,
				requestPathParameters,
				requestQueryParameters,
				responses,
				deprecated: data.deprecated,
				tags: data.tags,
				descriptions: this.collectPathInfo(path, data, x => x.description),
				summaries: this.collectPathInfo(path, data, x => x.summary),
				extensions: getExtensions(data),
				security: this.getSecurity(data),
			});

			paths.push(pathDef);
		}

		return paths;
	}

	static getResolvedParametersOnly(
		pattern: string,
		parameters?: (OpenApiParameterObject | OpenApiReferenceObject)[],
	): OpenApiParameterObject[] {
		const resolvedParameters: OpenApiParameterObject[] = [];

		if (parameters) {
			for (const p of parameters) {
				if (isOpenApiReferenceObject(p)) {
					schemaWarning(new UnresolvedReferenceError(p.$ref));
				} else {
					resolvedParameters.push(p);
				}
			}
		}

		return resolvedParameters;
	}

	static getSecurity(data: OpenApiOperationObject): PathSecurity {
		return data.security ?? [];
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
		commonParameters: OpenApiParameterObject[],
		concreteParameters: OpenApiParameterObject[],
	): OpenAPIV3.ParameterObject[] {
		const allParameters = [...commonParameters, ...concreteParameters];

		const params = allParameters.reduce<Record<string, OpenApiParameterObject>>(
			(acc, param) => ({ ...acc, [`${param.name}@${param.in}`]: param }),
			{},
		);

		return Object.values(params);
	}

	private static getRequestParameters<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		method: string,
		parameters: OpenAPIV3.ParameterObject[],
		parametersType: 'path' | 'query',
	): ObjectModel | undefined {
		const origin =
			parametersType === 'path'
				? PATH_PARAMETERS_OBJECT_ORIGIN
				: QUERY_PARAMETERS_OBJECT_ORIGIN;

		const properties: Property[] = [];

		for (const param of parameters) {
			if (param.in !== parametersType) {
				continue;
			}

			const prop = this.getRequestParameterProperty(
				parseSchemaEntity,
				pattern,
				method,
				origin,
				param,
			);

			properties.push(prop);
		}

		if (!properties.length) {
			return undefined;
		}

		const modelDef = new ObjectModel(`${method} ${pattern}`, {
			properties,
			origin,
		});

		const repository = ParserRepositoryService.getInstance<T>();

		repository.addEntity(modelDef);

		return modelDef;
	}

	private static getRequestParameterProperty<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		method: string,
		origin: string,
		param: OpenAPIV3.ParameterObject,
	): Property {
		const resolveProperty = (
			name: string,
			schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
			required?: boolean,
		): Property => {
			if (isOpenApiReferenceObject(schema)) {
				schemaWarning(new UnresolvedReferenceError(schema.$ref));

				return new Property(name, new UnknownModel(), { required });
			} else {
				const propDef = parseSchemaEntity(schema as T, {
					name: `${method} ${pattern} ${name}`,
					origin,
				});

				return new Property(name, propDef, {
					deprecated: schema.deprecated,
					description: schema.description,
					readonly: schema.readOnly,
					writeonly: schema.writeOnly,
					required,
				});
			}
		};

		if (param.schema) {
			return resolveProperty(param.name, param.schema, param.required);
		} else if (param.content) {
			const mediaTypeObject = Object.values(param.content).at(0);

			if (mediaTypeObject?.schema) {
				return resolveProperty(param.name, mediaTypeObject.schema, param.required);
			}
		}

		schemaWarning(new DefaultError('Schema not found', [pattern, method, param.name]));

		const propDef = new UnknownModel();

		return new Property(param.name, propDef, {
			required: param.required,
		});
	}

	private static getRequestBodies<T extends OpenApiV3xSchemaObject>(
		parseSchemaEntity: ParseSchemaEntityFn<T>,
		pattern: string,
		method: string,
		data: OpenApiV3xOperationObject,
	): PathRequestBody[] | undefined {
		const requestBodies: PathRequestBody[] = [];

		if (data.requestBody) {
			if (isOpenApiReferenceObject(data.requestBody)) {
				schemaWarning(new UnresolvedReferenceError(data.requestBody.$ref));
			} else {
				for (const [media, content] of Object.entries<
					OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject
				>(data.requestBody.content)) {
					if (content?.schema) {
						if (isOpenApiReferenceObject(content.schema)) {
							schemaWarning(new UnresolvedReferenceError(content.schema.$ref));
						} else {
							const entityName = `${method} ${pattern}`;

							const body = this.createPathBody(
								parseSchemaEntity,
								media,
								entityName,
								content.schema as T,
								data.requestBody.required,
								data.requestBody.description,
							);

							requestBodies.push(body);
						}
					}
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
		required?: boolean,
		description?: string,
	): PathRequestBody {
		const entity = parseSchemaEntity(schema, {
			name,
			origin: media === 'multipart/form-data' ? FORM_DATA_OBJECT_ORIGIN : BODY_OBJECT_ORIGIN,
		});

		return new PathRequestBody(media, entity, { required, description });
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
				schemaWarning(new UnresolvedReferenceError(res.$ref));

				continue;
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
			schemaWarning(new UnresolvedReferenceError(schema.$ref));

			return new PathResponse(code, media, new UnknownModel());
		}

		const entityName = `${method} ${pattern} ${code}`;

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
