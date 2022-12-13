import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ObjectModelDef } from '../../entities/schema-entities/object-model-def.model';
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
} from '../../entities/schema-entities/path-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { SchemaEntity } from '../../entities/shared.model';
import { Printer } from '../../print/printer';
import { assertUnreachable, mergeParts } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	getExtensions,
	isOpenApiReferenceObject,
	ParseSchemaEntityFn,
	TrivialError,
	UnresolvedReferenceError,
} from '../parser.model';

export class V31ParserPathService {
	constructor(
		private readonly repository: ParserRepositoryService<
			OpenAPIV3_1.SchemaObject,
			SchemaEntity
		>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	parse(pattern: string, path: OpenAPIV3_1.PathItemObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const method of Object.values(OpenAPIV3.HttpMethods)) {
			const data: OpenAPIV3_1.OperationObject | undefined = path[method];

			if (!data) {
				continue;
			}

			const allParameters = this.getAllRequestParameters(
				path.parameters ?? [],
				data.parameters ?? [],
			);

			const requestPathParameters = this.getRequestParameters(
				pattern,
				method,
				allParameters,
				'path',
			);

			const requestQueryParameters = this.getRequestParameters(
				pattern,
				method,
				allParameters,
				'query',
			);

			const responses = this.getResponses(pattern, method, data);

			const requestBody = this.getRequestBody(pattern, method, data);

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

	private collectPathInfo(
		path: OpenAPIV3_1.PathItemObject,
		data: OpenAPIV3_1.OperationObject,
		selector: (
			from: OpenAPIV3_1.PathItemObject | OpenAPIV3_1.OperationObject,
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

	private getAllRequestParameters(
		commonParameters: (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[],
		concreteParameters: (OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ParameterObject)[],
	): OpenAPIV3_1.ParameterObject[] {
		if (
			commonParameters.some(isOpenApiReferenceObject) ||
			concreteParameters.some(isOpenApiReferenceObject)
		) {
			throw new UnresolvedReferenceError();
		}

		const allParameters = [
			...commonParameters,
			...concreteParameters,
		] as OpenAPIV3_1.ParameterObject[];

		const params = allParameters.reduce<Record<string, OpenAPIV3_1.ParameterObject>>(
			(acc, param) => ({ ...acc, [`${param.name}@${param.in}`]: param }),
			{},
		);

		return Object.values(params);
	}

	private getRequestParameters(
		pattern: string,
		method: string,
		parameters: OpenAPIV3_1.ParameterObject[],
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

				const entity = this.parseSchemaEntity(param.schema, {
					name: mergeParts(pattern, method, param.name),
					origin,
				});

				const prop = new Property(param.name, entity, {
					deprecated: param.schema.deprecated,
					description: param.schema.description,
					nullable: param.schema.nullable,
					readonly: param.schema.readOnly,
					writeonly: param.schema.writeOnly,
					required: param.required,
				});

				properties.push(prop);
			} catch (e: unknown) {
				if (e instanceof TrivialError) {
					Printer.warn(`Warning ('${pattern}' -> '${param.name}'): ${e.message}`);
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

		this.repository.addEntity(modelDef);

		return modelDef;
	}

	private getRequestBody(
		pattern: string,
		method: string,
		data: OpenAPIV3_1.OperationObject,
	): PathRequestBody[] | undefined {
		const requestBodies: PathRequestBody[] = [];

		if (data.requestBody) {
			if (isOpenApiReferenceObject(data.requestBody)) {
				throw new UnresolvedReferenceError();
			}

			for (const [media, content] of Object.entries(data.requestBody.content)) {
				if (content?.schema) {
					if (isOpenApiReferenceObject(content.schema)) {
						throw new UnresolvedReferenceError();
					}

					const entityName = mergeParts(pattern, method);

					const body = this.createPathBody(media, entityName, content.schema);

					requestBodies.push(body);
				}
			}
		}

		return requestBodies.length ? requestBodies : undefined;
	}

	private createPathBody(
		media: string,
		name: string,
		schema: OpenAPIV3_1.SchemaObject,
	): PathRequestBody {
		const entity = this.parseSchemaEntity(schema, {
			name,
			origin: media === 'multipart/form-data' ? FORM_DATA_OBJECT_ORIGIN : BODY_OBJECT_ORIGIN,
		});

		return new PathRequestBody(media, entity);
	}

	private getResponses(
		pattern: string,
		method: string,
		data: OpenAPIV3_1.OperationObject,
	): PathResponse[] | undefined {
		const responses: PathResponse[] = [];

		for (const [code, res] of Object.entries(data.responses ?? {})) {
			if (isOpenApiReferenceObject(res)) {
				throw new UnresolvedReferenceError();
			}

			if (!res.content) {
				continue;
			}

			for (const [media, content] of Object.entries(res.content)) {
				if (content?.schema) {
					if (isOpenApiReferenceObject(content.schema)) {
						throw new UnresolvedReferenceError();
					}

					const entityName = mergeParts(pattern, method, code);

					const response = this.createPathResponse(
						code,
						media,
						entityName,
						content.schema,
					);

					responses.push(response);
				}
			}
		}

		return responses.length ? responses : undefined;
	}

	private createPathResponse(
		code: string,
		media: string,
		name: string,
		schema: OpenAPIV3_1.SchemaObject,
	): PathResponse {
		const entity = this.parseSchemaEntity(schema, {
			name,
			origin: RESPONSE_OBJECT_ORIGIN,
		});

		return new PathResponse(code, media, entity);
	}

	private mapMethodToInternal(value: OpenAPIV3_1.HttpMethods): PathMethod {
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
