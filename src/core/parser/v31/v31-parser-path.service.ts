import { OpenAPIV3_1 } from 'openapi-types';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { ICommonParserPathService } from '../common/common-parser.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { ParseSchemaEntityFn } from '../parser.model';

export class V31ParserPathService implements ICommonParserPathService<OpenAPIV3_1.PathItemObject> {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3_1.SchemaObject>,
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
