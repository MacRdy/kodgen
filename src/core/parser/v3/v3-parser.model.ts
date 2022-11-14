import { OpenAPIV3 } from 'openapi-types';
import { Extensions, SchemaEntity } from '../../entities/shared.model';

export type ParseSchemaEntityFn = (obj: OpenAPIV3.SchemaObject, name: string) => SchemaEntity;

export const isOpenApiV3ReferenceObject = (obj: unknown): obj is OpenAPIV3.ReferenceObject =>
	Object.prototype.hasOwnProperty.call<unknown, [keyof OpenAPIV3.ReferenceObject], boolean>(
		obj,
		'$ref',
	);

export const getExtensions = (
	schema: OpenAPIV3.SchemaObject | OpenAPIV3.PathItemObject | OpenAPIV3.OperationObject,
): Extensions => {
	const re = /^x-/;

	const extensions: Extensions = {};

	for (const [key, value] of Object.entries(schema)) {
		if (re.test(key)) {
			extensions[key] = value;
		}
	}

	return extensions;
};
