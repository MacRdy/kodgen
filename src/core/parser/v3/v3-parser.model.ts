import { OpenAPIV3 } from 'openapi-types';
import { SchemaEntity } from '../../entities/shared.model';

export type ParseSchemaEntityFn = (obj: OpenAPIV3.SchemaObject, name: string) => SchemaEntity;
