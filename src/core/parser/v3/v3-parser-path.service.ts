import { OpenAPIV3 } from 'openapi-types';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { TrivialError, UnresolvedReferenceError } from '../../../core/parser/parser.model';
import { Printer } from '../../../core/print/printer';
import {
	BODY_OBJECT_ORIGIN,
	PathDef,
	PathMethod,
	PathRequestBody,
	PathResponse,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../entities/schema-entities/path-def.model';
import { Property } from '../../entities/schema-entities/property.model';
import { isReferenceEntity, SchemaEntity } from '../../entities/shared.model';
import { assertUnreachable, mergeParts } from '../../utils';
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
		path: OpenAPIV3.PathItemObject,
		data: OpenAPIV3.OperationObject,
		selector: (
			from: OpenAPIV3.PathItemObject | OpenAPIV3.OperationObject,
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
		commonParameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
		concreteParameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
	): OpenAPIV3.ParameterObject[] {
		if (
			commonParameters.some(isOpenApiV3ReferenceObject) ||
			concreteParameters.some(isOpenApiV3ReferenceObject)
		) {
			throw new UnresolvedReferenceError();
		}

		const allParameters = [
			...commonParameters,
			...concreteParameters,
		] as OpenAPIV3.ParameterObject[];

		const params = allParameters.reduce<Record<string, OpenAPIV3.ParameterObject>>(
			(acc, param) => ({ ...acc, [`${param.name}@${param.in}`]: param }),
			{},
		);

		return Object.values(params);
	}

	private getRequestParameters(
		pattern: string,
		method: string,
		parameters: OpenAPIV3.ParameterObject[],
		parametersType: 'path' | 'query',
	): ObjectModelDef | undefined {
		const properties: Property[] = [];

		for (const param of parameters) {
			try {
				if (isOpenApiV3ReferenceObject(param.schema)) {
					throw new UnresolvedReferenceError();
				}

				if (param.in !== parametersType) {
					continue;
				}

				if (!param.schema) {
					throw new TrivialError('Schema not defined.');
				}

				const entity = this.parseSchemaEntity(
					param.schema,
					mergeParts(pattern, method, param.name),
				);

				const ref = new Property(param.name, entity, {
					deprecated: param.schema.deprecated,
					description: param.schema.description,
					nullable: param.schema.nullable,
					readonly: param.schema.readOnly,
					writeonly: param.schema.writeOnly,
					required: param.required,
				});

				properties.push(ref);
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
			isAutoName: true,
			origin:
				parametersType === 'path'
					? PATH_PARAMETERS_OBJECT_ORIGIN
					: QUERY_PARAMETERS_OBJECT_ORIGIN,
		});

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
				throw new UnresolvedReferenceError();
			}

			for (const [media, content] of Object.entries(data.requestBody.content)) {
				if (content?.schema) {
					if (isOpenApiV3ReferenceObject(content.schema)) {
						throw new UnresolvedReferenceError();
					}

					const entityName = mergeParts(pattern, method);

					const body = this.createPathObjectBody(media, entityName, content.schema);

					requestBodies.push(body);
				}
			}
		}

		return requestBodies.length ? requestBodies : undefined;
	}

	private createPathObjectBody(
		media: string,
		name: string,
		schema: OpenAPIV3.SchemaObject,
	): PathRequestBody {
		const entity = this.parseSchemaEntity(schema, name);

		if (isReferenceEntity(entity)) {
			entity.origin = BODY_OBJECT_ORIGIN;
			entity.isAutoName = entity.name === name;
		}

		return new PathRequestBody(media, entity);
	}

	private getResponses(
		pattern: string,
		method: string,
		data: OpenAPIV3.OperationObject,
	): PathResponse[] | undefined {
		const responses: PathResponse[] = [];

		for (const [code, res] of Object.entries(data.responses)) {
			if (isOpenApiV3ReferenceObject(res)) {
				throw new UnresolvedReferenceError();
			}

			if (!res.content) {
				continue;
			}

			for (const [media, content] of Object.entries(res.content)) {
				if (content?.schema) {
					if (isOpenApiV3ReferenceObject(content.schema)) {
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
		schema: OpenAPIV3.SchemaObject,
	): PathResponse {
		const entity = this.parseSchemaEntity(schema, name);

		if (isReferenceEntity(entity)) {
			entity.origin = RESPONSE_OBJECT_ORIGIN;
			entity.isAutoName = entity.name === name;
		}

		return new PathResponse(code, media, entity);
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
