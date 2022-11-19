import { EnumDef } from '@core/entities/schema-entities/enum-def.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { ITsEnum, ITsModel, ITsStorageInfo } from './typescript-generator.model';

export class TypescriptGeneratorStorageService {
	private readonly enumInfo = new Map<EnumDef, ITsStorageInfo<ITsEnum>>();
	private readonly modelInfo = new Map<ObjectModelDef, ITsStorageInfo<ITsModel[]>>();

	get(enumDef: EnumDef): ITsStorageInfo<ITsEnum> | undefined;
	get(modelDef: ObjectModelDef): ITsStorageInfo<ITsModel[]> | undefined;
	get(
		modelDef: EnumDef | ObjectModelDef,
	): ITsStorageInfo<ITsEnum> | ITsStorageInfo<ITsModel[]> | undefined;
	get(
		def: EnumDef | ObjectModelDef,
	): ITsStorageInfo<ITsEnum> | ITsStorageInfo<ITsModel[]> | undefined {
		return def instanceof EnumDef ? this.enumInfo.get(def) : this.modelInfo.get(def);
	}

	set(def: EnumDef, data: ITsStorageInfo<ITsEnum>): void;
	set(def: ObjectModelDef, data: ITsStorageInfo<ITsModel[]>): void;
	set(
		def: EnumDef | ObjectModelDef,
		data: ITsStorageInfo<ITsEnum> | ITsStorageInfo<ITsModel[]>,
	): void;
	set(
		def: EnumDef | ObjectModelDef,
		data: ITsStorageInfo<ITsEnum> | ITsStorageInfo<ITsModel[]>,
	): void {
		if (def instanceof EnumDef) {
			const existing = this.get(def);

			const info = data as ITsStorageInfo<ITsEnum>;

			this.enumInfo.set(def, {
				name: info.name ?? existing?.name,
				generated: info.generated ?? existing?.generated,
			});
		} else {
			const existing = this.get(def);

			const info = data as ITsStorageInfo<ITsModel[]>;

			this.modelInfo.set(def, {
				name: info.name ?? existing?.name,
				generated: info.generated ?? existing?.generated,
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

	getSummary(): (ITsStorageInfo<ITsEnum> | ITsStorageInfo<ITsModel[]>)[] {
		return [...this.enumInfo.values(), ...this.modelInfo.values()];
	}
}
