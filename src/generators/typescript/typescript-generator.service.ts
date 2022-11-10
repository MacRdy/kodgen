import { IDocument } from '@core/entities/document.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { TypescriptGeneratorEnumService } from './typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './typescript-generator-path.service';
import { ITsGeneratorConfig } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator {
	private readonly registry = new ImportRegistryService();

	private readonly enumService = new TypescriptGeneratorEnumService(this.registry, this.config);
	private readonly modelService = new TypescriptGeneratorModelService(this.registry, this.config);
	private readonly pathService = new TypescriptGeneratorPathService(this.registry, this.config);

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
