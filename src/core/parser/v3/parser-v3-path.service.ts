import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { SchemaEntity } from 'src/core/document.model';
import { ModelDef } from '../entities/model.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { isOpenApiV3ReferenceObject, ParseSchemaEntityFn } from './parser-v3.model';

export class ParserV3PathService {
	private readonly httpMethods: ReadonlyArray<OpenAPIV3.HttpMethods> = [
		OpenAPIV3.HttpMethods.GET,
		OpenAPIV3.HttpMethods.POST,
		OpenAPIV3.HttpMethods.PUT,
		OpenAPIV3.HttpMethods.DELETE,
	];

	constructor(
		private readonly repository: ParserRepositoryService<OpenAPIV3.SchemaObject, SchemaEntity>,
		private readonly refs: SwaggerParser.$Refs,
		private readonly parseSchemaEntity: ParseSchemaEntityFn,
	) {}

	parse(pattern: string, path: OpenAPIV3.PathItemObject): void {
		const parameters: ModelDef[] = [];

		for (const method of this.httpMethods) {
			const data: OpenAPIV3.OperationObject | undefined = path[method];

			if (!data) {
				continue;
			}

			if (data.parameters) {
				for (const param of data.parameters) {
					if (isOpenApiV3ReferenceObject(param)) {
						throw new Error('Unsupported parameter reference.');
					}

					if (!param.schema) {
						throw new Error('Parameter schema is not defined.');
					}

					const entity = this.parseSchemaEntity(param.name, param.schema, param.required);
					parameters.push(entity);
				}
			}

			console.log();
		}

		console.log(path);
	}
}
