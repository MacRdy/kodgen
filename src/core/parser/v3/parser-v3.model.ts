import { OpenAPIV3 } from 'openapi-types';
import { Reference } from '../entities/reference.model';

export type ParseNewSchemaFn = (
	name: string,
	obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	required?: boolean,
) => Reference;

export const isOpenApiV3ReferenceObject = (
	obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | OpenAPIV3.ParameterObject,
): obj is OpenAPIV3.ReferenceObject =>
	Object.prototype.hasOwnProperty.call<unknown, [keyof OpenAPIV3.ReferenceObject], boolean>(
		obj,
		'$ref',
	);
