import { OpenAPIV3_1 } from 'openapi-types';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { ParseSchemaEntityFn } from '../parser.model';

export class V31ParserPathService {
	constructor(
		private readonly repository: ParserRepositoryService<
			OpenAPIV3_1.SchemaObject,
			SchemaEntity
		>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	parse(pattern: string, path: OpenAPIV3_1.PathItemObject): PathDef[] {
		return CommonServicePathService.parse(
			this.repository,
			this.parseSchemaEntity,
			pattern,
			path,
		);
	}
}
