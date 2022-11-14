import { toKebabCase } from '@core/utils';
import { TypescriptGeneratorService } from '@generators/typescript/typescript-generator.service';
import pathLib from 'path';

export class NgTypescriptGeneratorService extends TypescriptGeneratorService {
	getName(): string {
		return 'ng-typescript';
	}

	getTemplateDir(): string {
		return pathLib.join(__dirname, 'templates');
	}

	constructor() {
		super({
			enumDir: 'enums',
			enumFileNameResolver: name => toKebabCase(name),
			enumTemplate: 'enum',
			modelDir: 'models',
			modelFileNameResolver: name => toKebabCase(name),
			modelTemplate: 'model',
			pathDir: 'services',
			pathFileNameResolver: name => `${toKebabCase(name)}.service`,
			pathTemplate: 'service',
		});
	}
}
