import { OpenAPIV3 } from 'openapi-types';
import { ParseSchemaEntityFn } from '../../../core/parser/parser.model';
import { PathDef } from '../../entities/schema-entities/path-def.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { ICommonParserPathService } from '../common/common-parser.model';

export class V3ParserPathService implements ICommonParserPathService<OpenAPIV3.PathItemObject> {
	constructor(private readonly parseSchemaEntity: ParseSchemaEntityFn<OpenAPIV3.SchemaObject>) {}

	parse(pattern: string, path: OpenAPIV3.PathItemObject): PathDef[] {
		return CommonServicePathService.parse(this.parseSchemaEntity, pattern, path);
	}
}
