import { ArrayModelDef } from '@core/entities/schema-entities/array-model-def.model';
import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import {
	BODY_OBJECT_ORIGIN,
	PATH_PARAMETERS_OBJECT_ORIGIN,
	QUERY_PARAMETERS_OBJECT_ORIGIN,
	RESPONSE_OBJECT_ORIGIN,
} from '@core/entities/schema-entities/path-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { SchemaEntity } from '@core/entities/shared.model';
import { Hooks } from '@core/hooks/hooks';
import { IImportRegistryEntry } from '@core/import-registry/import-registry.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { mergeParts } from '@core/utils';
import pathLib from 'path';
import { IGeneratorFile } from '../generator.model';
import { JSDocService } from './jsdoc/jsdoc.service';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import {
	generateEntityName,
	generatePropertyName,
	ITsGeneratorConfig,
	ITsModel,
	ITsModelProperty,
} from './typescript-generator.model';

export class TypescriptGeneratorModelService {
	constructor(
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly enumService: TypescriptGeneratorEnumService,
		private readonly config: ITsGeneratorConfig,
	) {}

	generate(models: ObjectModelDef[]): IGeneratorFile[] {
		const files: IGeneratorFile[] = [];

		for (const model of models) {
			const fileModels = this.getModels(model);

			const mainTemplateModel = fileModels[0];

			if (!mainTemplateModel) {
				throw new Error('Model was not generated.');
			}

			const path = pathLib.posix.join(
				this.config.modelDir,
				this.config.modelFileNameResolver(mainTemplateModel.name),
			);

			const file: IGeneratorFile = {
				path,
				template: this.config.modelTemplate,
				templateData: {
					models: fileModels,
					extensions: model.extensions,
					jsdoc: new JSDocService(),
					isValidName: (name: string) => !/^[^a-zA-Z_$]|[^\w$]/g.test(name),
					getImportEntries: () => this.getImportEntries(fileModels, path),
				},
			};

			this.storage.set(model, {
				name: fileModels[0]?.name,
				generated: fileModels,
			});

			for (const fileModel of fileModels) {
				this.importRegistry.createLink(fileModel.name, file.path);
			}

			files.push(file);
		}

		return files;
	}

	private getProperties(objectProperties: readonly Property[]): ITsModelProperty[] {
		const properties: ITsModelProperty[] = [];

		for (const p of objectProperties) {
			const dependencies: string[] = [];

			const propertyDef = this.resolvePropertyDef(p);

			if (!(propertyDef instanceof SimpleModelDef)) {
				const propertyType = this.resolvePropertyType(p, false, true);
				dependencies.push(propertyType);
			}

			const prop: ITsModelProperty = {
				name: p.name,
				nullable: p.nullable,
				required: p.required,
				type: this.resolvePropertyType(p),
				deprecated: p.deprecated,
				description: p.description,
				extensions: p.extensions,
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
		const resolveType = (type: string, format?: string): string | undefined => {
			if (type === 'boolean') {
				return 'boolean';
			} else if (type === 'integer' || type === 'number') {
				return 'number';
			} else if ((type === 'file' || type === 'string') && format === 'binary') {
				return 'File';
			} else if (type === 'string') {
				return 'string';
			}

			return undefined;
		};

		let type: string | undefined;

		if (prop instanceof Property) {
			type = this.resolvePropertyType(prop.def, false, ignoreArray);
		} else if (prop instanceof EnumDef) {
			const info = this.storage.get(prop);

			if (info?.name) {
				type = info.name;
			} else {
				const name = this.enumService.generateName(prop.name);

				this.storage.set(prop, { name });

				type = name;
			}
		} else if (prop instanceof ObjectModelDef) {
			const info = this.storage.get(prop);

			if (info?.name) {
				type = info.name;
			} else {
				const name = this.generateName(prop);

				this.storage.set(prop, { name });

				type = name;
			}
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolvePropertyType(prop.items, true, ignoreArray);
		} else if (prop instanceof SimpleModelDef) {
			const fn = Hooks.getOrDefault('resolvePropertyType', resolveType);

			type = fn(prop.type, prop.format);
		}

		type ??= 'unknown';

		return `${type}${!ignoreArray && isArray ? '[]' : ''}`;
	}

	private getImportEntries(models: ITsModel[], currentFilePath: string): IImportRegistryEntry[] {
		const dependencies: string[] = [];

		for (const m of models) {
			for (const p of m.properties) {
				dependencies.push(...p.dependencies);
			}
		}

		return this.importRegistry.getImportEntries(dependencies, currentFilePath);
	}

	private getModels(objectModel: ObjectModelDef): ITsModel[] {
		let modelDefs: ObjectModelDef[];

		if (objectModel.getOrigin() === QUERY_PARAMETERS_OBJECT_ORIGIN) {
			const { root, nestedModels } = this.simplify(objectModel);
			modelDefs = [root, ...nestedModels];
		} else {
			modelDefs = [objectModel];
		}

		const models: ITsModel[] = [];

		for (const def of modelDefs) {
			const storageInfo = this.storage.get(def);

			const model: ITsModel = {
				name: storageInfo?.name ?? this.generateName(def),
				properties: this.getProperties(def.properties),
				deprecated: def.deprecated,
			};

			models.push(model);
		}

		return models;
	}

	private generateName(modelDef: ObjectModelDef, modifier?: number): string {
		const name = generateEntityName(this.getRawName(modelDef, modifier));

		if (this.storage.isNameReserved(name)) {
			return this.generateName(modelDef, (modifier ?? 0) + 1);
		}

		return name;
	}

	private getRawName(modelDef: ObjectModelDef, modifier?: number): string {
		if (modelDef.isAutogeneratedName()) {
			if (modelDef.getOrigin() === PATH_PARAMETERS_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Path', 'Parameters');
			}

			if (modelDef.getOrigin() === QUERY_PARAMETERS_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Query', 'Parameters');
			}

			if (modelDef.getOrigin() === BODY_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Body');
			}

			if (modelDef.getOrigin() === RESPONSE_OBJECT_ORIGIN) {
				return mergeParts(modelDef.name, `${modifier ?? ''}`, 'Response');
			}
		}

		return `${modelDef.name}${modifier ?? ''}`;
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
			const nestedModel = new ObjectModelDef(mergeParts(model.name, name), properties);

			nestedModel.setOrigin(model.getOrigin(), model.isAutogeneratedName());

			const { root: simplifiedNestedModel, nestedModels: anotherNestedModels } =
				this.simplify(nestedModel);

			nestedModels.push(simplifiedNestedModel, ...anotherNestedModels);

			const newProperty = new Property(generatePropertyName(name), simplifiedNestedModel);

			rootProperties.push(newProperty);
		}

		const root = new ObjectModelDef(model.name, rootProperties);

		root.setOrigin(model.getOrigin(), model.isAutogeneratedName());

		return { root, nestedModels };
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
