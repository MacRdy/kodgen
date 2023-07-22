import { IGeneratorPackage, isGenerator, isGeneratorPackage } from './generator.model';

describe('generator-model', () => {
	it('should detect generator entity', () => {
		const generator: Record<string, unknown> = {
			getTemplateDir() {
				throw new Error('Method not implemented');
			},
			getName() {
				throw new Error('Method not implemented');
			},
		};

		expect(isGenerator(generator)).toBe(false);

		generator.generate = function () {
			throw new Error('Method not implemented');
		};

		expect(isGenerator(generator)).toBe(true);

		expect(isGenerator({})).toBe(false);
	});

	it('should detect generator package', () => {
		const pkg: IGeneratorPackage = {
			generators: [],
		};

		expect(isGeneratorPackage(pkg)).toBe(true);
		expect(isGeneratorPackage({})).toBe(false);
	});
});
