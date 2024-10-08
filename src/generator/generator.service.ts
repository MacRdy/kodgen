import { EOL } from 'os';
import pathLib from 'path';
import { FileService } from '../core/file/file.service';
import { Printer } from '../core/printer/printer';
import { TemplateData } from '../core/renderer/renderer.model';
import { RendererService } from '../core/renderer/renderer.service';
import {
	IGenerator,
	IGeneratorConfig,
	IGeneratorFile,
	IGeneratorPackage,
	isGenerator,
	isGeneratorPackage,
} from './generator.model';

export class GeneratorService {
	private readonly rendererService = new RendererService();
	private readonly fileService = new FileService();

	get(packageName: string, name: string): IGenerator {
		const pkg = this.fileService.loadModule<IGeneratorPackage>(packageName);

		if (!isGeneratorPackage(pkg)) {
			throw new Error('Invalid generator package');
		}

		const generator = pkg.generators.find(x => isGenerator(x) && x.getName() === name);

		if (!generator) {
			throw new Error('Generator not found');
		}

		return generator;
	}

	async build(
		templateDir: string,
		files: IGeneratorFile[],
		config: IGeneratorConfig,
	): Promise<void> {
		const outputPath = config.output;

		if (config.clean) {
			await this.fileService.removeDirectory(outputPath);
		}

		const userTemplateData = await this.getUserTemplateDataOrDefault(config.templateDataFile);

		for (const file of files) {
			Printer.verbose(`New file '${file.path}'`);

			if (config.skipTemplates?.includes(file.template)) {
				continue;
			}

			const templatePath = this.getTemplatePath(
				templateDir,
				file.template,
				config.templateDir,
			);

			const rawContent = await this.rendererService.render(templatePath, {
				k: file.templateData,
				d: userTemplateData,
			});

			const content = this.formatLineEndings(rawContent, config.eol);

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

	private async getUserTemplateDataOrDefault(
		filePath?: string,
	): Promise<TemplateData | undefined> {
		if (!filePath) {
			return undefined;
		}

		return this.fileService.loadFile<TemplateData>(filePath);
	}

	private formatLineEndings(content: string, eolFormat?: string): string {
		const eol = this.getEndOfLine(eolFormat);

		return content.replace(/\r\n|\r|\n/g, eol);
	}

	private getEndOfLine(type?: string): string {
		if (type?.toLowerCase() === 'cr') {
			return '\r';
		}

		if (type?.toLowerCase() === 'lf') {
			return '\n';
		}

		if (type?.toLowerCase() === 'crlf') {
			return '\r\n';
		}

		return EOL;
	}
}
