import { OpenAPIV3 } from 'openapi-types';
import { Reference } from '../entities/reference.model';

export type ParseNewSchemaFn = (
	name: string,
	obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
) => Reference;
