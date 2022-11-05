import { Config } from './config';
import { IConfig } from './config.model';

describe('config', () => {
	it('should an error when no instance yet', () => {
		expect(() => Config.get()).toThrow();
	});

	it('should initiate and reset config correctly', () => {
		const testConfig: IConfig = {
			generator: 'generator',
			input: 'input',
			output: 'output',
			clean: true,
			excludePaths: ['excludePath'],
			includePaths: ['includePath'],
			hooksFile: 'hooksFile',
			templateDataFile: 'templateDataFile',
			templateDir: 'templateDir',
		};

		Config.init(testConfig);

		expect(Config.get()).toStrictEqual(testConfig);

		Config.reset();

		expect(() => Config.get()).toThrow();
	});
});
