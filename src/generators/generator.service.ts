import pathLib from 'path';
import { ConfigService } from '../core/config/config.service';
import { FileService } from '../core/file.service';
import { RendererService } from '../core/renderer/renderer.service';
import { IGenerator, IGeneratorFile } from './generator.model';
import { NgTypescriptService } from './ng-typescript/ng-typescript.service';

export class GeneratorService {
	private readonly rendererService = new RendererService();
	private readonly fileService = new FileService();
	private readonly configService = ConfigService.getInstance();

	private readonly generators: readonly IGenerator[] = [new NgTypescriptService()];

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
		const config = this.configService.get();

		if (clean) {
			this.fileService.removeDirectory(outputPath);
		}

		for (const file of files) {
			let tplFolder: string;

			if (config.templateFolder) {
				const customTemplatePath = pathLib.join(config.templateFolder, file.templateUrl);
				const customTemplateExists = this.fileService.exists(customTemplatePath);

				if (customTemplateExists) {
					tplFolder = config.templateFolder;
				}
			}

			tplFolder ??= templateFolder;

			const content = await this.rendererService.render(
				tplFolder,
				file.templateUrl,
				file.templateData,
			);

			const outputFilePath = pathLib.join(outputPath, file.path);
			await this.fileService.createFile(outputFilePath, content);
		}
	}
}
