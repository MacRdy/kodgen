import { OpenAPIV3_1 } from 'openapi-types';
import { Path } from '../../entities/path.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { ICommonParserPathService } from '../common/common-parser.model';
import { ParseSchemaEntityFn } from '../parser.model';

export class V31ParserPathService implements ICommonParserPathService<OpenAPIV3_1.PathItemObject> {
	constructor(
		private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3_1.SchemaObject>,
	) {}

	parse(pattern: string, path: OpenAPIV3_1.PathItemObject): Path[] {
		return CommonServicePathService.parse(this.parseSchemaEntity, pattern, path);
	}
}
