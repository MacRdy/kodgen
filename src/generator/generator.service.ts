import path from 'path';
import { FileService } from '../core/file.service';
import { RendererService } from '../core/renderer/renderer.service';
import { IGenerator, IGeneratorFile } from './generator.model';
import { NgTypescriptService } from './ng-typescript/ng-typescript.service';

export class GeneratorService {
	private readonly rendererService = new RendererService();
	private readonly fileService = new FileService();

	private readonly generators: ReadonlyArray<IGenerator> = [new NgTypescriptService()];

	get(name: string): IGenerator {
		const generator = this.generators.find(x => x.getName() === name);

		if (!generator) {
			throw new Error('Generator not found.');
		}

		return generator;
	}

	async build(
		outputPath: string,
		clean: boolean,
		templateFolder: string,
		files: IGeneratorFile[],
	): Promise<void> {
		if (clean) {
			this.fileService.removeDirectory(outputPath);
		}

		for (const file of files) {
			const content = await this.rendererService.render(
				templateFolder,
				file.templateUrl,
				file.templateData,
			);

			const outputFilePath = path.join(outputPath, file.path);
			await this.fileService.createFile(outputFilePath, content);
		}
	}
}
