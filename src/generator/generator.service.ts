import { RendererService } from '../core/templating/renderer.service';
import { IGenerator, IGeneratorFile } from './generator.model';
import { TestGeneratorService } from './test-generator/test-generator.service';

export class GeneratorService {
	private readonly rendererService = new RendererService();

	private readonly generators: ReadonlyArray<IGenerator> = [new TestGeneratorService()];

	constructor(private readonly outputPath: string) {}

	get(name: string): IGenerator {
		const generator = this.generators.find(x => x.getName() === name);

		if (!generator) {
			throw new Error('Generator not found.');
		}

		return generator;
	}

	async process(files: IGeneratorFile[]): Promise<void> {
		for (const file of files) {
			await this.rendererService.render(
				this.outputPath,
				file.path,
				file.templateFolder,
				file.templateName,
				file.templateData,
			);
		}
	}
}
