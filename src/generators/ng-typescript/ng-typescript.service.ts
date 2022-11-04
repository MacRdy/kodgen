import { IDocument } from '@core/entities/document.model';
import { ImportRegistryService } from '@core/import-registry/import-registry.service';
import pathLib from 'path';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { NgTypescriptEnumService } from './ng-typescript-enum.service';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import { NgTypescriptPathService } from './ng-typescript-path.service';

export class NgTypescriptService implements IGenerator {
	private readonly registry = new ImportRegistryService();

	private readonly enumService = new NgTypescriptEnumService(this.registry);
	private readonly modelService = new NgTypescriptModelService(this.registry);
	private readonly pathService = new NgTypescriptPathService(this.registry);

	getName(): string {
		return 'ng-typescript';
	}

	getTemplateDir(): string {
		return pathLib.join(__dirname, 'templates');
	}

	generate(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [
			...this.enumService.generate(doc.enums),
			...this.modelService.generate(doc.models),
			...this.pathService.generate(doc.paths),
		];

		return files.map(x => ({ ...x, path: `${x.path}.ts` }));
	}
}
