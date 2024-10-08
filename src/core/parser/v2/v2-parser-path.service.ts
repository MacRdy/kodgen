import { OpenAPIV2 } from 'openapi-types';
import { ObjectModel } from '../../entities/model/object-model.model';
import { Property } from '../../entities/model/property.model';
import {
	BODY_OBJECT_ORIGIN,
	FORM_DATA_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	Path,
	PathMethod,
	PathRequestBody,
	PathResponse,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '../../entities/path.model';
import { assertUnreachable } from '../../utils';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { ICommonParserPathService } from '../common/common-parser.model';
import { ParserRepositoryService } from '../parser-repository.service';
import {
	ParseSchemaEntityFn,
	UnresolvedReferenceError,
	getExtensions,
	isOpenApiReferenceObject,
	schemaWarning,
} from '../parser.model';

export class V2ParserPathService implements ICommonParserPathService<OpenAPIV2.PathItemObject> {
	private readonly repository = ParserRepositoryService.getInstance<OpenAPIV2.SchemaObject>();

	constructor(private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV2.SchemaObject>) {}

	parse(pattern: string, path: OpenAPIV2.PathItemObject): Path[] {
		const paths: Path[] = [];

		const pathParameters = CommonServicePathService.getResolvedParametersOnly(
			pattern,
			path.parameters,
		);

		for (const method of Object.values(OpenAPIV2.HttpMethods)) {
			const data: OpenAPIV2.OperationObject | undefined = path[method];

			if (!data) {
				continue;
			}

			const parameters = CommonServicePathService.getResolvedParametersOnly(
				pattern,
				data.parameters,
			);

			const allParameters = CommonServicePathService.getAllRequestParameters(
				pathParameters,
				parameters,
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

			const requestBodies = this.getRequestBodies(
				pattern,
				method,
				data.consumes ?? [],
				allParameters,
			);

			const pathDef = new Path(pattern, this.mapMethodToInternal(method), {
				operationId: data.operationId,
				requestBodies,
				requestPathParameters,
				requestQueryParameters,
				responses,
				deprecated: data.deprecated,
				tags: data.tags,
				descriptions: data.description ? [data.description] : undefined,
				summaries: data.summary ? [data.summary] : undefined,
				extensions: getExtensions(data),
				security: CommonServicePathService.getSecurity(data),
			});

			paths.push(pathDef);
		}

		return paths;
	}

	private getResolvedParametersOnly(
		pattern: string,
		parameters?: (OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject)[],
	): OpenAPIV2.ParameterObject[] {
		const resolvedParameters: OpenAPIV2.ParameterObject[] = [];

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

	private getRequestParameters(
		pattern: string,
		method: string,
		parameters: OpenAPIV2.ParameterObject[],
		parametersType: 'path' | 'query' | 'formData',
	): ObjectModel | undefined {
		let origin: string;

		if (parametersType === 'path') {
			origin = PATH_PARAMETERS_OBJECT_ORIGIN;
		} else if (parametersType === 'query') {
			origin = QUERY_PARAMETERS_OBJECT_ORIGIN;
		} else {
			origin = FORM_DATA_OBJECT_ORIGIN;
		}

		const properties: Property[] = [];

		for (const paramObject of parameters) {
			const param = paramObject as OpenAPIV2.GeneralParameterObject;

			if (param.in !== parametersType) {
				continue;
			}

			const propDef = this.parseSchemaEntity(this.mapGeneralParamToSchema(param), {
				name: `${method} ${pattern} ${param.name}`,
				origin,
			});

			const prop = new Property(param.name, propDef, {
				description: param.description,
				required: param.required,
			});

			properties.push(prop);
		}

		if (!properties.length) {
			return undefined;
		}

		const modelDef = new ObjectModel(`${method} ${pattern}`, {
			properties,
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

	private getRequestBodies(
		pattern: string,
		method: string,
		consumes: string[],
		parameters: OpenAPIV2.ParameterObject[],
	): PathRequestBody[] | undefined {
		const requestBodies: PathRequestBody[] = [];

		for (const param of parameters) {
			if (isOpenApiReferenceObject(param)) {
				schemaWarning(new UnresolvedReferenceError(param.$ref));

				continue;
			}

			if (param.in === 'body' && param.schema) {
				if (isOpenApiReferenceObject(param.schema)) {
					schemaWarning(new UnresolvedReferenceError(param.schema.$ref));

					continue;
				}

				const entityName = `${method} ${pattern}`;

				for (const media of consumes) {
					const body = this.createPathBody(
						media,
						entityName,
						param.schema,
						param.required,
						param.description,
					);

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

	private createPathBody(
		media: string,
		name: string,
		schema: OpenAPIV2.SchemaObject,
		required?: boolean,
		description?: string,
	): PathRequestBody {
		const entity = this.parseSchemaEntity(schema, { name, origin: BODY_OBJECT_ORIGIN });

		return new PathRequestBody(media, entity, { required, description });
	}

	private getResponses(
		pattern: string,
		method: string,
		data: OpenAPIV2.OperationObject,
	): PathResponse[] | undefined {
		const produces = data.produces ?? [];
		const responses: PathResponse[] = [];

		for (const [code, res] of Object.entries(data.responses)) {
			if (isOpenApiReferenceObject(res)) {
				schemaWarning(new UnresolvedReferenceError(res.$ref));

				continue;
			}

			if (!res?.schema) {
				continue;
			}

			if (isOpenApiReferenceObject(res.schema)) {
				schemaWarning(new UnresolvedReferenceError(res.schema.$ref));

				continue;
			}

			const entityName = `${method} ${pattern} ${code}`;

			for (const media of produces) {
				const response = this.createPathResponse(
					code,
					media,
					entityName,
					res.schema,
					res.description,
				);

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
		description?: string,
	): PathResponse {
		const entity = this.parseSchemaEntity(schema, { name, origin: RESPONSE_OBJECT_ORIGIN });

		return new PathResponse(code, entity, { media, description });
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
