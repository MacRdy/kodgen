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
		super();
	}
}
