import { OpenAPIV2 } from 'openapi-types';
import { SchemaEntity } from '../../entities/shared.model';

export type ParseSchemaEntityFn = (obj: OpenAPIV2.SchemaObject, name: string) => SchemaEntity;
