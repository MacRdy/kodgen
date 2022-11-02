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

		for (const file of files) {
			const templatePath = this.getTemplatePath(templateDir, file.template);

			const content = await this.rendererService.render(templatePath, file.templateData);

			const outputFilePath = pathLib.join(outputPath, file.path);
			await this.fileService.createFile(outputFilePath, content);
		}
	}

	private getTemplatePath(templateDir: string, template: string): string {
		const customTemplateDir = this.configService.get().templateDir;
		const templateExt = this.rendererService.getExtension();

		const currentTemplate = template.endsWith(templateExt)
			? template
			: `${template}${templateExt}`;

		if (customTemplateDir) {
			const customTemplatePath = pathLib.join(customTemplateDir, currentTemplate);
			const customTemplateExists = this.fileService.exists(customTemplatePath);

			if (customTemplateExists) {
				return customTemplatePath;
			}
		}

		return pathLib.join(templateDir, currentTemplate);
	}
}
