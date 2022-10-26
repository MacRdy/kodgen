import { IGenerator } from './generator.model';
import { TestGeneratorService } from './test-generator/test-generator.service';

export class GeneratorService {
	private readonly generators: ReadonlyArray<IGenerator> = [new TestGeneratorService()];

	get(name: string): IGenerator {
		const generator = this.generators.find(x => x.getName() === name);

		if (!generator) {
			throw new Error('Generator not found.');
		}

		return generator;
	}
}
