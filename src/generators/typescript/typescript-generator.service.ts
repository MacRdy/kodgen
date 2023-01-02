import { IDocument } from '../../core/entities/document.model';
import { ImportRegistryService } from '../../core/import-registry/import-registry.service';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { TypescriptGeneratorEnumService } from './entities/typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './entities/typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './entities/typescript-generator-path.service';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { ITsGeneratorConfig } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator {
	private readonly storage = new TypescriptGeneratorStorageService();
	private readonly importRegistry = new ImportRegistryService();
	private readonly namingService = new TypescriptGeneratorNamingService();

	private readonly enumService = new TypescriptGeneratorEnumService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.config,
	);

	private readonly modelService = new TypescriptGeneratorModelService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.config,
	);

	private readonly pathService = new TypescriptGeneratorPathService(
		this.modelService,
		this.storage,
		this.importRegistry,
		this.namingService,
		this.config,
	);

	constructor(private readonly config: ITsGeneratorConfig) {}

	abstract getName(): string;

	abstract getTemplateDir(): string;

	generate(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [
			...this.enumService.generate(doc.enums),
			...this.modelService.generate(doc.models),
			...this.pathService.generate(doc.paths, doc.servers, doc.tags),
		];

		return files.map(x => ({ ...x, path: `${x.path}.ts` }));
	}
}
