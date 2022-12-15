import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type AnyOpenApiSchemaObject =
	| OpenAPIV2.SchemaObject
	| OpenAPIV3.SchemaObject
	| OpenAPIV3_1.SchemaObject;

export type AnyV3OpenApiSchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export type AnyV3OpenApiPathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;

export type AnyV3OpenApiOperationObject = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;

export type AnyOpenApiReferenceObject =
	| OpenAPIV2.ReferenceObject
	| OpenAPIV3.ReferenceObject
	| OpenAPIV3_1.ReferenceObject;

export type AnyV3OpenApiReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

export type AnyOpenApiParameterObject =
	| OpenAPIV2.ParameterObject
	| OpenAPIV3.ParameterObject
	| OpenAPIV3_1.ParameterObject;

export type AnyV3OpenApiParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;

export type AnyV3OpenApiResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;

export type AnyV3OpenApiMediaTypeObject = OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject;
