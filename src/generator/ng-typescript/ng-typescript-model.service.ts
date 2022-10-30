import cuid from 'cuid';
import pathLib from 'path';
import { EnumDef } from '../../core/entities/enum.model';
import {
	ArrayModelDef,
	ObjectModelDef,
	ReferenceModel,
	SimpleModelDef,
} from '../../core/entities/model.model';
import { SchemaEntity } from '../../core/entities/shared.model';
import { toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import { NgTypescriptRegistryService } from './ng-typescript-registry.service';
import {
	generateEntityName,
	generatePropertyName,
	INgtsImportEntry,
	INgtsModel,
	INgtsModelProperty,
} from './ng-typescript.model';

export class NgTypescriptModelService {
	constructor(private readonly registry: NgTypescriptRegistryService) {}

	generate(models: ObjectModelDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const m of models) {
			const fileModels = this.getModels(m);

			let fileName = `${toKebabCase(m.name)}.ts`;

			if (fileName.length > 256) {
				fileName = `${cuid()}.ts`;
			}

			const path = pathLib.posix.join('models', fileName);

			const file: IGeneratorFile = {
				path,
				templateUrl: 'model',
				templateData: {
					models: fileModels,
					isValidName: (name: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(name),
					buildImports: () => this.buildImports(fileModels, path),
				},
			};

			for (const m of fileModels) {
				this.registry.createLink(m.name, file.path);
			}

			files.push(file);
		}

		return files;
	}

	getProperties(objectProperties: ReadonlyArray<ReferenceModel>): INgtsModelProperty[] {
		const properties: INgtsModelProperty[] = [];

		for (const p of objectProperties) {
			const dependencies: string[] = [];

			const propertyDef = this.resolvePropertyDef(p);

			if (!(propertyDef instanceof SimpleModelDef)) {
				const propertyType = this.resolvePropertyType(p, false, true);
				dependencies.push(propertyType);
			}

			const prop: INgtsModelProperty = {
				name: p.name,
				nullable: !!p.nullable,
				required: !!p.required,
				type: this.resolvePropertyType(p),
				dependencies,
			};

			properties.push(prop);
		}

		return properties;
	}

	resolvePropertyDef(
		prop: SchemaEntity | ReferenceModel,
	): EnumDef | ObjectModelDef | SimpleModelDef {
		if (prop instanceof ReferenceModel) {
			return this.resolvePropertyDef(prop.def);
		} else if (prop instanceof ArrayModelDef) {
			return this.resolvePropertyDef(prop.items);
		} else {
			return prop;
		}
	}

	resolvePropertyType(
		prop: SchemaEntity | ReferenceModel,
		isArray?: boolean,
		ignoreArray?: boolean,
	): string {
		let type: string;

		if (prop instanceof ReferenceModel) {
			type = this.resolvePropertyType(prop.def, false, ignoreArray);
		} else if (prop instanceof ObjectModelDef || prop instanceof EnumDef) {
			type = generateEntityName(prop.name);
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolvePropertyType(prop.items, true, ignoreArray);
		} else if (prop instanceof SimpleModelDef) {
			if (prop.type === 'file') {
				type = 'File';
			} else if (prop.type === 'boolean') {
				type = 'boolean';
			} else if (prop.type === 'integer' || prop.type === 'number') {
				type = 'number';
			} else if (prop.type === 'string') {
				type = 'string';
			}
		}

		type ??= 'unknown';

		return `${type}${!ignoreArray && isArray ? '[]' : ''}`;
	}

	private buildImports(models: INgtsModel[], currentFilePath: string): INgtsImportEntry[] {
		const dependencies: string[] = [];

		for (const m of models) {
			for (const p of m.properties) {
				dependencies.push(...p.dependencies);
			}
		}

		return this.registry.resolveImportEntries(dependencies, currentFilePath);
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
				name: this.resolvePropertyType(def, false, true),
				properties: this.getProperties(def.properties),
			};

			models.push(model);
		}

		return models;
	}

	private simplify(model: ObjectModelDef, aux: ObjectModelDef[]): ObjectModelDef {
		const newModels: Record<string, ReferenceModel[]> = {};

		for (const prop of model.properties) {
			if (prop.name.includes('.')) {
				const parts = prop.name.split('.');
				const nestedModelName = parts.shift();

				if (nestedModelName) {
					let properties: ReferenceModel[];
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
						? `${generatePropertyName(nextPropNamePart)}.${parts.join('.')}`
						: generatePropertyName(nextPropNamePart);

					const newProperty = prop.clone(propName);
					properties.push(newProperty);
				}
			}
		}

		const newNestedPropertyNames = Object.keys(newModels);

		const newRootProperties: ReferenceModel[] = model.properties
			.filter(x => !newNestedPropertyNames.some(name => x.name.startsWith(`${name}.`)))
			.map(x => x.clone(generatePropertyName(x.name)));

		for (const [name, properties] of Object.entries(newModels)) {
			const newNestedModel = new ObjectModelDef(
				generateEntityName(model.name, name),
				properties,
			);

			const simplifiedNestedModel = this.simplify(newNestedModel, aux);
			aux.push(simplifiedNestedModel);

			const newProperty = new ReferenceModel(
				generatePropertyName(name),
				simplifiedNestedModel,
				false,
				false,
			);

			newRootProperties.push(newProperty);
		}

		const newRootModel = new ObjectModelDef(model.name, newRootProperties);

		return newRootModel;
	}
}
