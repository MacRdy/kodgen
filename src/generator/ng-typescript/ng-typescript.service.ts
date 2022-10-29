import { IDocument } from '../../core/entities/document.model';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { NgTypescriptEnumService } from './ng-typescript-enum.service';
import { NgTypescriptModelService } from './ng-typescript-model.service';
import { NgTypescriptPathService } from './ng-typescript-path.service';

export class NgTypescriptService implements IGenerator {
	private readonly enumService = new NgTypescriptEnumService();
	private readonly modelService = new NgTypescriptModelService();
	private readonly pathService = new NgTypescriptPathService();

	getName(): string {
		return 'ng-typescript';
	}

	getTemplateFolder(): string {
		return './src/generator/ng-typescript/templates';
	}

	generate(doc: IDocument): IGeneratorFile[] {
		const files: IGeneratorFile[] = [
			...this.enumService.generate(doc.enums),
			...this.modelService.generate(doc.models),
			...this.pathService.generate(doc.paths),
		];

		return files;
	}
}
