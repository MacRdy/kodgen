import { OpenAPIV2 } from 'openapi-types';
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
import { isReferenceEntity, SchemaEntity } from '../../entities/shared.model';
import { Printer } from '../../print/printer';
import { assertUnreachable, mergeParts } from '../../utils';
import { ParserRepositoryService } from '../parser-repository.service';
import { TrivialError, UnresolvedReferenceError } from '../parser.model';
import { getExtensions, isOpenApiV3ReferenceObject } from '../v3/v3-parser.model';
import { ParseSchemaEntityFn } from './v2-parser.model';

export class V2ParserPathService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(pattern: string, path: OpenAPIV2.PathItemObject): PathDef[] {
		const paths: PathDef[] = [];

		for (const method of Object.values(OpenAPIV2.HttpMethods)) {
			const data: OpenAPIV2.OperationObject | undefined = path[method];

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

			const requestBody = this.getRequestBody(
				pattern,
				method,
				data.consumes ?? [],
				allParameters,
			);

			const pathDef = new PathDef(pattern, this.mapMethodToInternal(method), {
				requestBody,
				requestPathParameters,
				requestQueryParameters,
				responses,
				deprecated: data.deprecated,
				tags: data.tags,
				descriptions: data.description ? [data.description] : undefined,
				summaries: data.summary ? [data.summary] : undefined,
				extensions: getExtensions(data),
			});

			paths.push(pathDef);
		}

		return paths;
	}

	private getAllRequestParameters(
		commonParameters: (OpenAPIV2.ReferenceObject | OpenAPIV2.ParameterObject)[],
		concreteParameters: (OpenAPIV2.ReferenceObject | OpenAPIV2.ParameterObject)[],
	): OpenAPIV2.ParameterObject[] {
		if (
			commonParameters.some(isOpenApiV3ReferenceObject) ||
			concreteParameters.some(isOpenApiV3ReferenceObject)
		) {
			throw new UnresolvedReferenceError();
		}

		const allParameters = [
			...commonParameters,
			...concreteParameters,
		] as OpenAPIV2.ParameterObject[];

		const params = allParameters.reduce<Record<string, OpenAPIV2.ParameterObject>>(
			(acc, param) => ({ ...acc, [`${param.name}@${param.in}`]: param }),
			{},
		);

		return Object.values(params);
	}

	private getRequestParameters(
		pattern: string,
		method: string,
		parameters: OpenAPIV2.ParameterObject[],
		parametersType: 'path' | 'query' | 'formData',
	): ObjectModelDef | undefined {
		const properties: Property[] = [];

		for (const paramObject of parameters) {
			try {
				const param = paramObject as OpenAPIV2.GeneralParameterObject;

				if (param.in !== parametersType) {
					continue;
				}

				const entity = this.parseSchemaEntity(
					this.mapGeneralParamToSchema(param),
					mergeParts(pattern, method, param.name),
				);

				const prop = new Property(param.name, entity, {
					description: param.description,
					required: param.required,
				});

				properties.push(prop);
			} catch (e: unknown) {
				if (e instanceof TrivialError) {
					Printer.warn(`Warning ('${pattern}' -> '${paramObject.name}'): ${e.message}`);
				} else {
					throw e;
				}
			}
		}

		if (!properties.length) {
			return undefined;
		}

		let origin: string;

		if (parametersType === 'path') {
			origin = PATH_PARAMETERS_OBJECT_ORIGIN;
		} else if (parametersType === 'query') {
			origin = QUERY_PARAMETERS_OBJECT_ORIGIN;
		} else {
			origin = FORM_DATA_OBJECT_ORIGIN;
		}

		const modelDef = new ObjectModelDef(mergeParts(pattern, method), {
			properties,
			isAutoName: true,
			origin,
		});

		this.repository.addEntity(modelDef);

		return modelDef;
	}

	private mapGeneralParamToSchema(
		param: OpenAPIV2.GeneralParameterObject,
	): OpenAPIV2.SchemaObject {
		return {
			type: param.type,
			format: param.format,
			items: param.items,
			collectionFormat: param.collectionFormat,
			enum: param.enum,
			description: param.description,
		};
	}

	private getRequestBody(
		pattern: string,
		method: string,
		consumes: string[],
		parameters: OpenAPIV2.ParameterObject[],
	): PathRequestBody[] | undefined {
		const requestBodies: PathRequestBody[] = [];

		for (const param of parameters) {
			if (isOpenApiV3ReferenceObject(param)) {
				throw new UnresolvedReferenceError();
			}

			if (param.in === 'body' && param.schema) {
				if (isOpenApiV3ReferenceObject(param.schema)) {
					throw new UnresolvedReferenceError();
				}

				const entityName = mergeParts(pattern, method);

				for (const media of consumes) {
					const body = this.createPathObjectBody(media, entityName, param.schema);
					requestBodies.push(body);
				}
			}
		}

		const formData = this.getRequestParameters(pattern, method, parameters, 'formData');

		if (formData) {
			const formDataRequestBody = new PathRequestBody('multipart/form-data', formData);
			requestBodies.push(formDataRequestBody);
		}

		return requestBodies.length ? requestBodies : undefined;
	}

	private createPathObjectBody(
		media: string,
		name: string,
		schema: OpenAPIV2.SchemaObject,
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
		data: OpenAPIV2.OperationObject,
	): PathResponse[] | undefined {
		const produces = data.produces ?? [];
		const responses: PathResponse[] = [];

		for (const [code, res] of Object.entries(data.responses)) {
			if (isOpenApiV3ReferenceObject(res)) {
				throw new UnresolvedReferenceError();
			}

			if (!res?.schema) {
				continue;
			}

			if (isOpenApiV3ReferenceObject(res.schema)) {
				throw new UnresolvedReferenceError();
			}

			const entityName = mergeParts(pattern, method, code);

			for (const media of produces) {
				const response = this.createPathResponse(code, media, entityName, res.schema);

				responses.push(response);
			}
		}

		return responses.length ? responses : undefined;
	}

	private createPathResponse(
		code: string,
		media: string,
		name: string,
		schema: OpenAPIV2.SchemaObject,
	): PathResponse {
		const entity = this.parseSchemaEntity(schema, name);

		if (isReferenceEntity(entity)) {
			entity.origin = RESPONSE_OBJECT_ORIGIN;
			entity.isAutoName = entity.name === name;
		}

		return new PathResponse(code, media, entity);
	}

	private mapMethodToInternal(value: OpenAPIV2.HttpMethods): PathMethod {
		switch (value) {
			case OpenAPIV2.HttpMethods.GET:
				return 'GET';
			case OpenAPIV2.HttpMethods.POST:
				return 'POST';
			case OpenAPIV2.HttpMethods.PUT:
				return 'PUT';
			case OpenAPIV2.HttpMethods.DELETE:
				return 'DELETE';
			case OpenAPIV2.HttpMethods.OPTIONS:
				return 'OPTIONS';
			case OpenAPIV2.HttpMethods.PATCH:
				return 'PATCH';
			case OpenAPIV2.HttpMethods.HEAD:
				return 'HEAD';
			default:
				return assertUnreachable(value);
		}
	}
}
