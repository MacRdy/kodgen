import { IDocument } from '@core/entities/document.model';
import { ObjectModelDef } from '@core/entities/schema-entities/object-model-def.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { Storage } from '@core/storage/storage.service';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';
import { ITsGeneratorConfig, ITsModel } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator {
	private readonly modelStorage = new Storage<ObjectModelDef, ITsModel[]>();
	private readonly importRegistry = new ImportRegistryService();

	private readonly enumService = new TypescriptGeneratorEnumService(
		this.importRegistry,
		this.config,
	);

	private readonly modelService = new TypescriptGeneratorModelService(
		this.modelStorage,
		this.importRegistry,
		this.config,
	);

	private readonly pathService = new TypescriptGeneratorPathService(
		this.modelService,
		this.modelStorage,
		this.importRegistry,
		this.config,
	);

	constructor(private readonly config: ITsGeneratorConfig) {}

	abstract getName(): string;

	abstract getTemplateDir(): string;

	generate(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [
			...this.enumService.generate(doc.enums),
			...this.modelService.generate(doc.models),
			...this.pathService.generate(doc.paths),
		];

		return files.map(x => ({ ...x, path: `${x.path}.ts` }));
	}
}
