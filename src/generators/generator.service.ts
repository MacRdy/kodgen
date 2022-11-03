import { Config } from '@core/config/config';
import { FileService } from '@core/file.service';
import { TemplateData } from '@core/renderer/renderer.model';
import { RendererService } from '@core/renderer/renderer.service';
import pathLib from 'path';
import { IGenerator, IGeneratorFile } from './generator.model';
import { NgTypescriptService } from './ng-typescript/ng-typescript.service';

export class GeneratorService {
	private readonly rendererService = new RendererService();
	private readonly fileService = new FileService();

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
		const config = Config.get();

		if (clean) {
			this.fileService.removeDirectory(outputPath);
		}

		const additionalTemplateData = await this.getAdditionalTemplateData(
			config.templateDataFile,
		);

		for (const file of files) {
			const templatePath = this.getTemplatePath(
				templateDir,
				file.template,
				config.templateDir,
			);

			const fileTemplateData = this.mergeTemplateData(
				file.templateData,
				additionalTemplateData,
			);

			const content = await this.rendererService.render(templatePath, fileTemplateData);

			const outputFilePath = pathLib.join(outputPath, file.path);
			await this.fileService.createFile(outputFilePath, content);
		}
	}

	private getTemplatePath(
		templateDir: string,
		template: string,
		customTemplateDir?: string,
	): string {
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

	private async getAdditionalTemplateData(filePath?: string): Promise<TemplateData | undefined> {
		if (!filePath) {
			return undefined;
		}

		if (filePath.endsWith('.json')) {
			return await this.fileService.loadJson<TemplateData>(filePath);
		}

		const data = this.fileService.loadJs<TemplateData>(filePath);

		if (!data) {
			throw new Error('Additional template data could not be loaded.');
		}

		return data;
	}

	private mergeTemplateData(
		templateData?: TemplateData,
		additionalTemplateData?: TemplateData,
	): TemplateData | undefined {
		return additionalTemplateData
			? { ...templateData, ...additionalTemplateData }
			: templateData;
	}
}
