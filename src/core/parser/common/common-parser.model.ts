import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { PathDef } from '../../../core/entities/schema-entities/path-def.model';
import { SchemaEntity } from '../../../core/entities/shared.model';
import { IParseSchemaData } from '../parser.model';

export interface ICommonParserConfig {
	readonly includePaths?: readonly string[];
	readonly excludePaths?: readonly string[];
}

export interface ICommonParserSchemaService<T extends OpenApiSchemaObject> {
	parse(schema: T, data?: IParseSchemaData): SchemaEntity;
}

export interface ICommonParserPathService<T extends OpenApiPathsItemObject> {
	parse(pattern: string, path: T): PathDef[];
}

export type OpenApiSchemaObject =
	| OpenAPIV2.SchemaObject
	| OpenAPIV3.SchemaObject
	| OpenAPIV3_1.SchemaObject;

export type OpenApiV3xSchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;

export type OpenApiV3xPathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;

export type OpenApiV3xOperationObject = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;

export type OpenApiOperationObject =
	| OpenAPIV2.OperationObject
	| OpenAPIV3.OperationObject
	| OpenAPIV3_1.OperationObject;

export type OpenApiReferenceObject =
	| OpenAPIV2.ReferenceObject
	| OpenAPIV3.ReferenceObject
	| OpenAPIV3_1.ReferenceObject;

export type OpenApiV3xReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

export type OpenApiParameterObject =
	| OpenAPIV2.ParameterObject
	| OpenAPIV3.ParameterObject
	| OpenAPIV3_1.ParameterObject;

export type OpenApiV3xParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;

export type OpenApiV3xResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;

export type OpenApiV3xMediaTypeObject = OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject;

export type OpenApiPathsItemObject =
	| OpenAPIV2.PathItemObject
	| OpenAPIV3.PathItemObject
	| OpenAPIV3_1.PathItemObject
	| undefined;
