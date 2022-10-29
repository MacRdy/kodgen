import { EnumDef } from '../../core/entities/enum.model';
import {
	ArrayModelDef,
	ModelDef,
	ObjectModelDef,
	PrimitiveModelDef,
	ReferenceModelDef,
} from '../../core/entities/model.model';
import { SchemaEntity } from '../../core/entities/shared.model';
import { toCamelCase, toKebabCase, toPascalCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { INgtsModel, INgtsModelProperty } from './ng-typescript.model';

export class NgTypescriptModelService {
	generate(models: ObjectModelDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const m of models) {
			const file: IGeneratorFile = {
				path: `models/${toKebabCase(m.name)}.ts`,
				templateUrl: 'model',
				templateData: {
					models: this.getModels(m),
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

	private getModels(objectModel: ObjectModelDef): INgtsModel[] {
		const auxModelDefs: ObjectModelDef[] = [];

		const simplifiedModel = objectModel.name.endsWith('QueryParameters')
			? this.simplify(objectModel, auxModelDefs)
			: objectModel;

		const modelDefs = [...auxModelDefs, simplifiedModel];
		const models: INgtsModel[] = [];

		for (const def of modelDefs) {
			const model: INgtsModel = {
				name: toPascalCase(def.name),
				properties: this.getProperties(def.properties),
			};

			models.push(model);
		}

		return models;
	}

	private simplify(model: ObjectModelDef, aux: ObjectModelDef[]): ObjectModelDef {
		const flatComplexModel = model.properties.some(x => x.name.includes('.'));

		if (!flatComplexModel) {
			return model;
		}

		const newModels: Record<string, ModelDef[]> = {};

		for (const prop of model.properties) {
			if (prop.name.includes('.')) {
				const parts = prop.name.split('.');
				const nestedModelName = parts.shift();

				if (nestedModelName) {
					let properties: ModelDef[];
					const existingProperties = newModels[nestedModelName];

					if (existingProperties) {
						properties = existingProperties;
					} else {
						properties = [];
						newModels[nestedModelName] = properties;
					}

					const nextPropNamePart = parts.shift();

					if (!nextPropNamePart) {
						throw new Error('Invalid property name.');
					}

					const propName = parts.length
						? `${toCamelCase(nextPropNamePart)}.${parts.join('.')}`
						: toCamelCase(nextPropNamePart);

					const newProperty = prop.clone(propName);
					properties.push(newProperty);
				}
			}
		}

		const newNestedPropertyNames = Object.keys(newModels);

		const newRootProperties: ModelDef[] = model.properties
			.filter(x => !newNestedPropertyNames.some(name => x.name.startsWith(`${name}.`)))
			.map(x => x.clone(toCamelCase(x.name)));

		for (const [name, properties] of Object.entries(newModels)) {
			const newNestedModel = new ObjectModelDef(
				`${model.name}${toPascalCase(name)}`,
				properties,
			);

			const simplifiedNestedModel = this.simplify(newNestedModel, aux);
			aux.push(simplifiedNestedModel);

			const newProperty = new ReferenceModelDef(
				toCamelCase(name),
				simplifiedNestedModel,
				properties.some(x => x.required),
				false,
			);

			newRootProperties.push(newProperty);
		}

		const newRootModel = new ObjectModelDef(model.name, newRootProperties);

		return newRootModel;
	}
}
