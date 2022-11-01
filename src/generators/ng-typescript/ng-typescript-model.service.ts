import cuid from 'cuid';
import pathLib from 'path';
import { ArrayModelDef } from '../../core/entities/schema-entities/array-model-def.model';
import { EnumDef } from '../../core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../core/entities/schema-entities/model-def.model';
import { Property } from '../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../core/entities/schema-entities/simple-model-def.model';
import { SchemaEntity } from '../../core/entities/shared.model';
import { IImportRegistryEntry } from '../../core/import-registry/import-registry.model';
import { ImportRegistryService } from '../../core/import-registry/import-registry.service';
import { toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../generator.model';
import {
	generateEntityName,
	generatePropertyName,
	INgtsModel,
	INgtsModelProperty,
} from './ng-typescript.model';

export class NgTypescriptModelService {
	constructor(private readonly registry: ImportRegistryService) {}

	generate(models: ObjectModelDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const model of models) {
			const fileModels = this.getModels(model);

			let fileName = `${toKebabCase(model.name)}.ts`;

			if (fileName.length > 256) {
				fileName = `${cuid()}.ts`;
			}

			const path = pathLib.posix.join('models', fileName);

			const file: IGeneratorFile = {
				path,
				templatePath: 'model',
				templateData: {
					models: fileModels,
					isValidName: (name: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(name),
					getImportEntries: () => this.getImportEntries(fileModels, path),
				},
			};

			for (const fileModel of fileModels) {
				this.registry.createLink(fileModel.name, file.path);
			}

			files.push(file);
		}

		return files;
	}

	getProperties(objectProperties: readonly Property[]): INgtsModelProperty[] {
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

	resolvePropertyDef(prop: SchemaEntity | Property): EnumDef | ObjectModelDef | SimpleModelDef {
		if (prop instanceof Property) {
			return this.resolvePropertyDef(prop.def);
		} else if (prop instanceof ArrayModelDef) {
			return this.resolvePropertyDef(prop.items);
		} else {
			return prop;
		}
	}

	resolvePropertyType(
		prop: SchemaEntity | Property,
		isArray?: boolean,
		ignoreArray?: boolean,
	): string {
		let type: string;

		if (prop instanceof Property) {
			type = this.resolvePropertyType(prop.def, false, ignoreArray);
		} else if (prop instanceof ObjectModelDef || prop instanceof EnumDef) {
			type = generateEntityName(prop.name);
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolvePropertyType(prop.items, true, ignoreArray);
		} else if (prop instanceof SimpleModelDef) {
			if (prop.type === 'boolean') {
				type = 'boolean';
			} else if (prop.type === 'integer' || prop.type === 'number') {
				type = 'number';
			} else if (
				(prop.type === 'file' || prop.type === 'string') &&
				prop.format === 'binary'
			) {
				type = 'File';
			} else if (prop.type === 'string') {
				type = 'string';
			}
		}

		type ??= 'unknown';

		return `${type}${!ignoreArray && isArray ? '[]' : ''}`;
	}

	private getImportEntries(
		models: INgtsModel[],
		currentFilePath: string,
	): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const m of models) {
			for (const p of m.properties) {
				dependencies.push(...p.dependencies);
			}
		}

		return this.registry.getImportEntries(dependencies, currentFilePath);
	}

	private getModels(objectModel: ObjectModelDef): INgtsModel[] {
		let modelDefs: ObjectModelDef[];

		if (objectModel.name.endsWith('RequestQueryParameters')) {
			const { root, nestedModels } = this.simplify(objectModel);
			modelDefs = [root, ...nestedModels];
		} else {
			modelDefs = [objectModel];
		}

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

	private simplify(model: ObjectModelDef): {
		root: ObjectModelDef;
		nestedModels: ObjectModelDef[];
	} {
		const nestedModels: ObjectModelDef[] = [];

		const instructions = this.getSplitModelInstructions(model);
		const newPropertyNames = Object.keys(instructions);

		const rootProperties = model.properties
			.filter(x => !newPropertyNames.some(name => x.name.startsWith(`${name}.`)))
			.map(x => x.clone(generatePropertyName(x.name)));

		for (const [name, properties] of Object.entries(instructions)) {
			const nestedModel = new ObjectModelDef(
				generateEntityName(model.name, name),
				properties,
			);

			const { root: simplifiedNestedModel, nestedModels: anotherNestedModels } =
				this.simplify(nestedModel);

			nestedModels.push(simplifiedNestedModel, ...anotherNestedModels);

			const newProperty = new Property(
				generatePropertyName(name),
				simplifiedNestedModel,
				false,
				false,
			);

			rootProperties.push(newProperty);
		}

		return {
			root: new ObjectModelDef(model.name, rootProperties),
			nestedModels,
		};
	}

	private getSplitModelInstructions(model: ObjectModelDef): Record<string, Property[]> {
		const models: Record<string, Property[]> = {};

		for (const prop of model.properties) {
			if (prop.name.includes('.')) {
				const parts = prop.name.split('.');
				const nestedModelName = parts.shift();

				if (!nestedModelName) {
					continue;
				}

				let properties: Property[] | undefined = models[nestedModelName];

				if (!properties) {
					properties = [];
					models[nestedModelName] = properties;
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

		return models;
	}
}
