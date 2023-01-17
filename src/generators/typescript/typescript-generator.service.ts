import { IDocument } from '../../core/entities/document.model';
import { ImportRegistryService } from '../../core/import-registry/import-registry.service';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { TypescriptGeneratorEnumService } from './entities/typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './entities/typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './entities/typescript-generator-path.service';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { ITsGenConfig, ITsGenParameters } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator<ITsGenConfig> {
	private readonly storage = new TypescriptGeneratorStorageService();
	private readonly importRegistry = new ImportRegistryService();
	private readonly namingService = new TypescriptGeneratorNamingService();

	private readonly enumService = new TypescriptGeneratorEnumService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	private readonly modelService = new TypescriptGeneratorModelService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	private readonly pathService = new TypescriptGeneratorPathService(
		this.modelService,
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	constructor(private readonly parameters: ITsGenParameters) {}

	abstract getName(): string;

	abstract getTemplateDir(): string;

	abstract prepareConfig(userConfig?: ITsGenConfig): ITsGenConfig;

	generate(doc: IDocument, config?: ITsGenConfig): IGeneratorFile[] {
		if (!config) {
			throw new Error('Generator config not defined');
		}

		const files: IGeneratorFile[] = [
			...this.enumService.generate(doc.enums),
			...this.modelService.generate(doc.models, config),
			...this.pathService.generate(doc.paths, doc.servers, doc.tags, config),
		];

		if (config?.index) {
			const paths = files.map(x => x.path);

			files.push({
				path: 'index',
				template: 'index',
				templateData: { paths },
			});
		}

		return files.map(x => ({ ...x, path: `${x.path}.ts` }));
	}
}
