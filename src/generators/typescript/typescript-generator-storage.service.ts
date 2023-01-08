import { EnumDef } from '../../core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '../../core/entities/schema-entities/object-model-def.model';
import { ITsGenEnum, ITsGenModel, ITsGenStorageInfo } from './typescript-generator.model';

export class TypescriptGeneratorStorageService {
	private readonly enumInfo = new Map<EnumDef, ITsGenStorageInfo<ITsGenEnum>>();
	private readonly modelInfo = new Map<ObjectModelDef, ITsGenStorageInfo<ITsGenModel>>();

	get(enumDef: EnumDef): ITsGenStorageInfo<ITsGenEnum> | undefined;
	get(modelDef: ObjectModelDef): ITsGenStorageInfo<ITsGenModel> | undefined;
	get(
		modelDef: EnumDef | ObjectModelDef,
	): ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel> | undefined;
	get(
		def: EnumDef | ObjectModelDef,
	): ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel> | undefined {
		return def instanceof EnumDef ? this.enumInfo.get(def) : this.modelInfo.get(def);
	}

	set(def: EnumDef, data: ITsGenStorageInfo<ITsGenEnum>): void;
	set(def: ObjectModelDef, data: ITsGenStorageInfo<ITsGenModel>): void;
	set(
		def: EnumDef | ObjectModelDef,
		data: ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel>,
	): void;
	set(
		def: EnumDef | ObjectModelDef,
		data: ITsGenStorageInfo<ITsGenEnum> | ITsGenStorageInfo<ITsGenModel>,
	): void {
		if (def instanceof EnumDef) {
			const existing = this.get(def);

			const info = data as ITsGenStorageInfo<ITsGenEnum>;

			this.enumInfo.set(def, {
				name: info.name ?? existing?.name,
				generatedModel: info.generatedModel ?? existing?.generatedModel,
			});
		} else {
			const existing = this.get(def);

			const info = data as ITsGenStorageInfo<ITsGenModel>;

			this.modelInfo.set(def, {
				name: info.name ?? existing?.name,
				generatedModel: info.generatedModel ?? existing?.generatedModel,
				mapping: info.mapping ?? existing?.mapping,
			});
		}
	}

	delete(def: EnumDef | ObjectModelDef): void {
		if (def instanceof EnumDef) {
			this.enumInfo.delete(def);
		} else {
			this.modelInfo.delete(def);
		}
	}
}
