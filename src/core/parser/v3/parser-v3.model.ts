import { OpenAPIV3 } from 'openapi-types';
import { SchemaEntity } from '../../entities/shared.model';

export type ParseSchemaEntityFn = (obj: OpenAPIV3.SchemaObject, name: string) => SchemaEntity;

export const isOpenApiV3ReferenceObject = (obj: unknown): obj is OpenAPIV3.ReferenceObject =>
	Object.prototype.hasOwnProperty.call<unknown, [keyof OpenAPIV3.ReferenceObject], boolean>(
		obj,
		'$ref',
	);
