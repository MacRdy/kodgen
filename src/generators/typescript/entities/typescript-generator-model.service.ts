import { ArrayModelDef } from '@core/entities/schema-entities/array-model-def.model';
import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { QUERY_PARAMETERS_OBJECT_ORIGIN } from '@core/entities/schema-entities/path-def.model';
import { Property } from '@core/entities/schema-entities/property.model';
import { SimpleModelDef } from '@core/entities/schema-entities/simple-model-def.model';
import { isReferenceEntity, SchemaEntity } from '@core/entities/shared.model';
import { Hooks } from '@core/hooks/hooks';
import { IImportRegistryEntry } from '@core/import-registry/import-registry.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { mergeParts } from '@core/utils';
import pathLib from 'path';
import { IGeneratorFile } from '../../generator.model';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	generatePropertyName,
	ITsGeneratorConfig,
	ITsModel,
	ITsModelProperty,
} from '../typescript-generator.model';

export class TypescriptGeneratorModelService {
	constructor(
		private readonly storage: TypescriptGeneratorStorageService,
		private readonly importRegistry: ImportRegistryService,
		private readonly namingService: TypescriptGeneratorNamingService,
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

			const mainModel = fileModels[0];

			if (mainModel) {
				this.storage.set(model, {
					name: mainModel.name,
					generatedModel: mainModel,
				});
			}

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

			const type = this.resolvePropertyType(p);

			const prop: ITsModelProperty = {
				name: p.name,
				nullable: p.nullable,
				required: p.required,
				type: type,
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
		} else if (isReferenceEntity(prop)) {
			type = this.resolveReferenceEntityName(prop);
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolvePropertyType(prop.items, true, ignoreArray);
		} else if (prop instanceof SimpleModelDef) {
			const fn = Hooks.getOrDefault('resolvePropertyType', resolveType);

			type = fn(prop.type, prop.format);
		}

		type ??= 'unknown';

		return `${type}${!ignoreArray && isArray ? '[]' : ''}`;
	}

	private resolveReferenceEntityName(entity: EnumDef | ObjectModelDef): string {
		const storageInfo = this.storage.get(entity);

		if (storageInfo?.name) {
			return storageInfo.name;
		}

		const name = this.namingService.generateUniqueReferenceEntityName(entity);

		this.storage.set(entity, { name });

		return name;
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

	private restructComplexModel(objectModel: ObjectModelDef): ObjectModelDef[] {
		const newModels: ObjectModelDef[] = [objectModel];

		const structure = objectModel.properties.reduce<Record<string, Property[]>>((acc, prop) => {
			const basePropName = prop.name.split('.').shift();

			if (basePropName) {
				acc[basePropName] = acc[basePropName] ?? [];
				acc[basePropName]?.push(prop);
			}

			return acc;
		}, {});

		const newProperties: Property[] = [];

		for (const [key, rawProps] of Object.entries(structure)) {
			if (rawProps.some(x => !x.name.startsWith(`${key}.`))) {
				newProperties.push(...rawProps);
				continue;
			}

			const properties = rawProps.map(x => x.clone(x.name.substring(key.length + 1)));

			const object = new ObjectModelDef(mergeParts(objectModel.name, key), properties);
			object.setOrigin(objectModel.getOrigin(), objectModel.isAutoName());

			const property = new Property(key, object);
			newProperties.push(property);

			const objectPropertyModels = this.restructComplexModel(object);
			newModels.push(...objectPropertyModels);
		}

		// TODO getHash()
		const key = `${objectModel.name}@${objectModel.getOrigin()}`;
		objectModel.setProperties(this.remapProperties(key, newProperties));

		return newModels;
	}

	private remapProperties(entityName: string, rawProps: Property[]): Property[] {
		const finalProps: Property[] = [];

		for (const prop of rawProps) {
			const name = this.namingService.generateUniquePropertyName(entityName, [prop.name]);

			const finalProp = prop.clone(name);

			finalProps.push(finalProp);
		}

		return finalProps;
	}

	private getModels(objectModel: ObjectModelDef): ITsModel[] {
		const modelDefs =
			objectModel.getOrigin() === QUERY_PARAMETERS_OBJECT_ORIGIN
				? this.restructComplexModel(objectModel)
				: [objectModel];

		const models: ITsModel[] = [];

		for (const def of modelDefs) {
			const storageInfo = this.storage.get(def);

			const name =
				storageInfo?.name ?? this.namingService.generateUniqueReferenceEntityName(def);

			this.storage.set(def, { name });

			const generatedModel: ITsModel = {
				name,
				properties: this.getProperties(def.properties),
				deprecated: def.deprecated,
			};

			this.storage.set(def, { generatedModel });

			models.push(generatedModel);
		}

		return models;
	}

	// TODO return simple array
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

			nestedModel.setOrigin(model.getOrigin(), model.isAutoName());

			const { root: simplifiedNestedModel, nestedModels: anotherNestedModels } =
				this.simplify(nestedModel);

			nestedModels.push(simplifiedNestedModel, ...anotherNestedModels);

			const newProperty = new Property(generatePropertyName(name), simplifiedNestedModel);

			rootProperties.push(newProperty);
		}

		const root = new ObjectModelDef(model.name, rootProperties);

		root.setOrigin(model.getOrigin(), model.isAutoName());

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
