import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { IDocument } from '../entities/document.model';
import { IEnum } from '../entities/enum.model';
import { IObject } from '../entities/object.model';
import { IPath } from '../entities/path.model';
import { IParserService } from './parser.model';

export class ParserV3Service implements IParserService<OpenAPIV3.Document> {
	isSupported(doc: OpenAPI.Document): boolean {
		try {
			const v3Doc = doc as OpenAPIV3.Document;

			return !!v3Doc.openapi.startsWith('3.0.');
		} catch {}

		return false;
	}

	parse(doc: OpenAPIV3.Document): IDocument {
		const enums: IEnum[] = [];

		if (doc.components?.schemas) {
			for (const [name, schemaOrRef] of Object.entries(doc.components.schemas)) {
				if (this.isReferenceObject(schemaOrRef)) {
					throw new Error('Unsupported reference object.');
				}

				if (this.isEnum(schemaOrRef)) {
					enums.push(this.parseEnum(name, schemaOrRef));
				}
			}
		}

		return {
			enums,
			objects: this.getObjects(doc),
			paths: this.getPaths(doc),
		};
	}

	private isEnum(schema: OpenAPIV3.SchemaObject): boolean {
		return !!schema.enum;
	}

	private parseEnum(name: string, schema: OpenAPIV3.SchemaObject): IEnum {
		return {
			name,
		};
	}

	private getObjects(doc: OpenAPIV3.Document): IObject[] {
		return [];
	}

	private getPaths(doc: OpenAPIV3.Document): IPath[] {
		return [];
	}

	private isReferenceObject(
		value: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
	): value is OpenAPIV3.ReferenceObject {
		return Object.prototype.hasOwnProperty.call<
			OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
			[keyof OpenAPIV3.ReferenceObject],
			boolean
		>(value, '$ref');
	}
}
