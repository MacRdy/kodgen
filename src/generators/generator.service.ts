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
		templateDir: string,
		files: IGeneratorFile[],
	): Promise<void> {
		if (clean) {
			this.fileService.removeDirectory(outputPath);
		}

		const customTemplateDir = this.configService.get().templateDir;

		for (const file of files) {
			let fileTemplateDir = templateDir;

			if (customTemplateDir) {
				const customTemplatePath = pathLib.join(customTemplateDir, file.templatePath);
				const customTemplateExists = this.fileService.exists(customTemplatePath);

				if (customTemplateExists) {
					fileTemplateDir = customTemplateDir;
				}
			}

			const content = await this.rendererService.render(
				fileTemplateDir,
				file.templatePath,
				file.templateData,
			);

			const outputFilePath = pathLib.join(outputPath, file.path);
			await this.fileService.createFile(outputFilePath, content);
		}
	}
}
