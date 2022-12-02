import pathLib from 'path';
import { ArrayModelDef } from '../../../core/entities/schema-entities/array-model-def.model';
import { EnumDef } from '../../../core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../../core/entities/schema-entities/object-model-def.model';
import { QUERY_PARAMETERS_OBJECT_ORIGIN } from '../../../core/entities/schema-entities/path-def.model';
import { Property } from '../../../core/entities/schema-entities/property.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { isReferenceEntity, SchemaEntity } from '../../../core/entities/shared.model';
import { Hooks } from '../../../core/hooks/hooks';
import { IImportRegistryEntry } from '../../../core/import-registry/import-registry.model';
import { ImportRegistryService } from '../../../core/import-registry/import-registry.service';
import { mergeParts } from '../../../core/utils';
import { IGeneratorFile } from '../../generator.model';
import { JSDocService } from '../jsdoc/jsdoc.service';
import { TypescriptGeneratorNamingService } from '../typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from '../typescript-generator-storage.service';
import {
	ITsGeneratorConfig,
	ITsModel,
	ITsModelProperty,
	ITsPropertyMapping,
} from '../typescript-generator.model';

export class TypescriptGeneratorModelService {
	private objectKey = 0;

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
				const propertyType = this.resolveType(p, false, true);
				dependencies.push(propertyType);
			}

			const type = this.resolveType(p);

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

	resolveType(prop: SchemaEntity | Property, isArray?: boolean, ignoreArray?: boolean): string {
		const resolveType = (type: string, format?: string): string | undefined => {
			if (type === 'boolean') {
				return 'boolean';
			} else if (type === 'integer' || type === 'number') {
				return 'number';
			} else if (type === 'file' || (type === 'string' && format === 'binary')) {
				return 'File';
			} else if (type === 'string') {
				return 'string';
			}

			return undefined;
		};

		let type: string | undefined;

		if (prop instanceof Property) {
			type = this.resolveType(prop.def, false, ignoreArray);
		} else if (isReferenceEntity(prop)) {
			type = this.resolveReferenceEntityName(prop);
		} else if (prop instanceof ArrayModelDef) {
			type = this.resolveType(prop.items, true, ignoreArray);
		} else if (prop instanceof SimpleModelDef) {
			const fn = Hooks.getOrDefault('resolveType', resolveType);

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

	private getModels(objectModel: ObjectModelDef): ITsModel[] {
		let defs: ObjectModelDef[] = [objectModel];

		if (objectModel.origin === QUERY_PARAMETERS_OBJECT_ORIGIN) {
			defs = this.restructModel(objectModel);

			const mapping = this.remapProperties(objectModel);

			this.storage.set(objectModel, { mapping });
		}

		const models: ITsModel[] = [];

		for (const def of defs) {
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

	private restructModel(objectModel: ObjectModelDef): ObjectModelDef[] {
		const newModels: ObjectModelDef[] = [objectModel];

		const structure = objectModel.properties.reduce<Record<string, Property[]>>((acc, prop) => {
			const parts = prop.name.split('.');

			const propName =
				parts.length > 1 && parts.every(Boolean) && parts[0] ? parts[0] : prop.name;

			if (propName) {
				acc[propName] = acc[propName] ?? [];
				acc[propName]?.push(prop);
			}

			return acc;
		}, {});

		const newProperties: Property[] = [];

		for (const [key, properties] of Object.entries(structure)) {
			if (properties.some(x => !x.name.startsWith(`${key}.`))) {
				newProperties.push(...properties);
				continue;
			}

			for (const prop of properties) {
				prop.name = prop.name.substring(key.length + 1);
			}

			const object = new ObjectModelDef(mergeParts(objectModel.name, key), { properties });

			object.origin = objectModel.origin;
			object.isAutoName = objectModel.isAutoName;

			const property = new Property(key, object);
			newProperties.push(property);

			const objectPropertyModels = this.restructModel(object);
			newModels.push(...objectPropertyModels);
		}

		objectModel.properties = newProperties;

		return newModels;
	}

	private remapProperties(
		objectModel: ObjectModelDef,
		baseOriginalNamePath: string[] = [],
		baseObjectPath: string[] = [],
	): ITsPropertyMapping[] {
		const key = `${++this.objectKey}_${objectModel.name}@${objectModel.origin}`;
		const mapping: ITsPropertyMapping[] = [];

		for (const prop of objectModel.properties) {
			const oldName = prop.name;

			const newName = this.namingService.generateUniquePropertyName(key, [oldName]);
			prop.name = newName;

			const objectPath = [...baseObjectPath, newName];
			const originalNamePath = [...baseOriginalNamePath, oldName];

			if (prop.def instanceof ObjectModelDef) {
				mapping.push(...this.remapProperties(prop.def, originalNamePath, objectPath));
			} else {
				mapping.push({
					originalName: originalNamePath.join('.'),
					objectPath,
				});
			}
		}

		return mapping;
	}
}
