import { OpenAPIV3 } from 'openapi-types';
import { ParseSchemaEntityFn } from '../../../core/parser/parser.model';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { ParserRepositoryService } from '../parser-repository.service';

export class V3ParserPathService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject>,
	) {}

	parse(pattern: string, path: OpenAPIV3.PathItemObject): PathDef[] {
		return CommonServicePathService.parse(
			this.repository,
			this.parseSchemaEntity,
			pattern,
			path,
		);
	}
}
