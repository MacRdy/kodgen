import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type AnyOpenApiSchemaObject =
	| OpenAPIV2.SchemaObject
	| OpenAPIV3.SchemaObject
	| OpenAPIV3_1.SchemaObject;
