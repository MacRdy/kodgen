import { IDocument } from '@core/entities/document.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { ITsGeneratorConfig } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator {
	private readonly storage = new TypescriptGeneratorStorageService();
	private readonly importRegistry = new ImportRegistryService();

	private readonly enumService = new TypescriptGeneratorEnumService(
		this.storage,
		this.importRegistry,
		this.config,
	);

	private readonly modelService = new TypescriptGeneratorModelService(
		this.storage,
		this.importRegistry,
		this.enumService,
		this.config,
	);

	private readonly pathService = new TypescriptGeneratorPathService(
		this.modelService,
		this.storage,
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
