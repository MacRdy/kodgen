import { OpenAPIV2 } from 'openapi-types';
import { EnumDef } from '../../entities/schema-entities/enum-def.model';
import { SchemaEntity } from '../../entities/shared.model';
import { CommonParserSchemaService } from '../common/common-parser-schema.service';
import { ParserRepositoryService } from '../parser-repository.service';
import { IParseSchemaData } from '../parser.model';

export class V2ParserEnumService {
	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV2.SchemaObject, SchemaEntity>,
	) {}

	isSupported(obj: OpenAPIV2.SchemaObject): boolean {
		return !!obj.enum;
	}

	parse(schema: OpenAPIV2.SchemaObject, data?: IParseSchemaData): EnumDef {
		return CommonParserSchemaService.parseEnum(this.repository, schema, data);
	}
}
