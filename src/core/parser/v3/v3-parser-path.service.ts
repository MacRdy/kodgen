import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { OpenAPIV3 } from 'openapi-types';
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

			const pathDef = new PathDef(
				pattern,
				this.mapMethodToInternal(method),
				requestPathParameters,
				requestQueryParameters,
				requestBody,
				responses,
				data.tags,
				data.deprecated,
				this.collectPathInfo(path, data, x => x.summary),
				this.collectPathInfo(path, data, x => x.description),
				getExtensions(data),
			);

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
			throw unresolvedSchemaReferenceError();
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
			if (isOpenApiV3ReferenceObject(param.schema)) {
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

		if (!properties.length) {
			return undefined;
		}

		const modelDef = new ObjectModelDef(mergeParts(pattern, method), properties);

		const origin =
			parametersType === 'path'
				? PATH_PARAMETERS_OBJECT_ORIGIN
				: QUERY_PARAMETERS_OBJECT_ORIGIN;

		modelDef.setOrigin(origin, true);

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

					const entityName = mergeParts(pattern, method);
					const entity = this.parseSchemaEntity(content.schema, entityName);

					if (isReferenceEntity(entity)) {
						entity.setOrigin(BODY_OBJECT_ORIGIN, entity.name === entityName);
					}

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

					const entityName = mergeParts(pattern, method, code);
					const entity = this.parseSchemaEntity(content.schema, entityName);

					if (isReferenceEntity(entity)) {
						entity.setOrigin(RESPONSE_OBJECT_ORIGIN, entity.name === entityName);
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
