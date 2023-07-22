import { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { ModelDef } from '../../../core/entities/shared.model';
import { Path } from '../../entities/path.model';
import { IParseSchemaData } from '../parser.model';

export interface ICommonParserConfig {
	readonly includePaths?: readonly string[];
	readonly excludePaths?: readonly string[];
}

export interface ICommonParserEnumData {
	readonly name: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly entryValues?: any[];
	readonly entryNames?: Array<string | undefined>;
	readonly entryDescriptions?: Array<string | undefined>;
}

export interface ICommonParserMsEnumValue {
	name?: string;
	description?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value?: any;
}

export interface ICommonParserMsEnum {
	name?: string;
	values?: ICommonParserMsEnumValue[];
}

export interface ICommonParserSchemaService<T extends OpenApiSchemaObject> {
	parse(schema: T, data?: IParseSchemaData): ModelDef;
}

export interface ICommonParserPathService<T extends OpenApiPathsItemObject> {
	parse(pattern: string, path: T): Path[];
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

export type OpenApiTagObject = OpenAPIV2.TagObject | OpenAPIV3.TagObject | OpenAPIV3_1.TagObject;

export type OpenApiV3xServerObject = OpenAPIV3.ServerObject | OpenAPIV3_1.ServerObject;

export type OpenApiInfoObject = OpenAPIV2.InfoObject &
	OpenAPIV3.InfoObject &
	OpenAPIV3_1.InfoObject;
