import { OpenAPIV3 } from 'openapi-types';
import { Entity } from 'src/core/document.model';

export type ParseEntityFn = (
	name: string,
	obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	required?: boolean,
) => Entity;

export const isOpenApiV3ReferenceObject = (
	obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | OpenAPIV3.ParameterObject,
): obj is OpenAPIV3.ReferenceObject =>
	Object.prototype.hasOwnProperty.call<unknown, [keyof OpenAPIV3.ReferenceObject], boolean>(
		obj,
		'$ref',
	);
