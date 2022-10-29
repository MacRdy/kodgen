import { EnumDef } from '../../core/entities/enum.model';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModelDef,
} from '../../core/entities/model.model';
import { SchemaEntity } from '../../core/entities/shared.model';
import { toKebabCase, toPascalCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { INgtsModel, INgtsModelProperty } from './ng-typescript.model';

export class NgTypescriptModelService {
	generate(models: ObjectModelDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const m of models) {
			const model = this.getModel(m);

			const file: IGeneratorFile = {
				path: `models/${toKebabCase(m.name)}.ts`,
				templateUrl: 'model',
				templateData: {
					name: model.name,
					properties: model.properties,
					isValidName: (name: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(name),
				},
			};

			files.push(file);
		}

		return files;
	}

	getProperties(models: ReadonlyArray<ModelDef>): INgtsModelProperty[] {
		const properties: INgtsModelProperty[] = [];

		for (const p of models) {
			const target = p instanceof ReferenceModelDef ? p.def : p;

			const prop: INgtsModelProperty = {
				name: p.name,
				nullable: !!p.nullable,
				required: !!p.required,
				type: this.resolvePropertyType(target),
			};

			properties.push(prop);
		}

		return properties;
	}

	resolvePropertyType(prop: SchemaEntity, isArray?: boolean): string {
		let type: string;

		if (prop instanceof ReferenceModelDef) {
			type = this.resolvePropertyType(prop.def);
		} else if (prop instanceof ObjectModelDef || prop instanceof EnumDef) {
			type = toPascalCase(prop.name);
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolvePropertyType(prop.itemsDef, true);
		} else if (prop instanceof PrimitiveModelDef) {
			if (prop.type === 'boolean') {
				type = 'boolean';
			} else if (prop.type === 'integer' || prop.type === 'number') {
				type = 'number';
			} else if (prop.type === 'string') {
				type = 'string';
			}
		}

		type ??= 'unknown';

		return `${type}${isArray ? '[]' : ''}`;
	}

	private getModel(objectModel: ObjectModelDef): INgtsModel {
		return {
			name: toPascalCase(objectModel.name),
			properties: this.getProperties(objectModel.properties),
		};
	}
}
