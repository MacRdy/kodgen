import pathLib from 'path';
import { IDocument } from '../../core/entities/document.model';
import { toKebabCase } from '../../core/utils';
import { IGeneratorFile } from '../../generators/generator.model';
import { TypescriptGeneratorService } from '../../generators/typescript/typescript-generator.service';
import { ITsGenConfig } from '../typescript/typescript-generator.model';

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

	override generate(doc: IDocument, config?: ITsGenConfig): IGeneratorFile[] {
		const files = super.generate(doc, config);

		files.push({
			path: 'internals.ts',
			template: 'internals',
		});

		return files;
	}
}
