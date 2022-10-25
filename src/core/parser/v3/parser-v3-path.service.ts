import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { ParserRepositoryService } from '../parser-repository.service';

export class ParserV3PathService {
	constructor(
		private readonly repository: ParserRepositoryService,
		private readonly refs: SwaggerParser.$Refs,
	) {}

	parse(name: string, path: OpenAPIV3.PathItemObject): void {}
}
