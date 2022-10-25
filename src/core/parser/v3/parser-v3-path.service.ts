import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { ModelDef } from '../entities/model.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { isOpenApiV3ReferenceObject, ParseNewSchemaFn } from './parser-v3.model';

export class ParserV3PathService {
	constructor(
		private readonly repository: ParserRepositoryService,
		private readonly refs: SwaggerParser.$Refs,
		private readonly parseNewSchema: ParseNewSchemaFn,
	) {}

	parse(pattern: string, path: OpenAPIV3.PathItemObject): void {
		const parameters: ModelDef[] = [];

		for (const method of Object.values(OpenAPIV3.HttpMethods)) {
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

					const entity = this.parseNewSchema(param.name, param.schema, param.required);

					parameters.push(entity);

					console.log(param);
					// const modelDef = this.parseNewSchema(param.)
				}
			}
		}

		console.log(path);
	}
}
