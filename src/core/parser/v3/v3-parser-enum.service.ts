import { OpenAPIV3 } from 'openapi-types';
import { EnumDef } from '../../entities/schema-entities/enum-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParseSchemaData } from '../parser.model';

export class V3ParserEnumService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
	) {}

	isSupported(obj: OpenAPIV3.SchemaObject): boolean {
		return !!obj.enum;
	}

	parse(schema: OpenAPIV3.SchemaObject, data?: IParseSchemaData): EnumDef {
		return CommonParserSchemaService.parseEnum(this.repository, schema, data);
	}
}
