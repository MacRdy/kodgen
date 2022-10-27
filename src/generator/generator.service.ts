import path from 'path';
import { FileService } from '../core/file.service';
import { RendererService } from '../core/renderer/renderer.service';
import { IGenerator, IGeneratorFile } from './generator.model';
import { TestGeneratorService } from './test-generator/test-generator.service';

export class GeneratorService {
	private readonly rendererService = new RendererService();
	private readonly fileService = new FileService();

	private readonly generators: ReadonlyArray<IGenerator> = [new TestGeneratorService()];

	get(name: string): IGenerator {
		const generator = this.generators.find(x => x.getName() === name);

		if (!generator) {
			throw new Error('Generator not found.');
		}

		return generator;
	}

	async build(outputPath: string, files: IGeneratorFile[]): Promise<void> {
		for (const file of files) {
			const content = await this.rendererService.render(
				file.templateFolder,
				file.templateName,
				file.templateData,
			);

			const outputFilePath = path.join(outputPath, file.path);
			await this.fileService.createFile(outputFilePath, content);
		}
	}
}
