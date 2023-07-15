import { IDocument } from '../core/entities/document.model';
import { TemplateData } from '../core/renderer/renderer.model';

export interface IGeneratorConfig {
	readonly output: string;
	readonly clean?: boolean;
	readonly templateDir?: string;
	readonly templateDataFile?: string;
	readonly skipTemplates?: readonly string[];
	readonly eol?: string;
}

export interface IGeneratorFile {
	path: string;
	template: string;
	templateData?: TemplateData;
}

export interface IGenerator<T = unknown> {
	getName(): string;
	getTemplateDir(): string;
	generate(doc: IDocument, config?: T): IGeneratorFile[];
	prepareConfig?(userConfig?: T): T;
}

export interface IGeneratorPackage {
	generators: IGenerator[];
}

export const isGenerator = (obj: unknown): obj is IGenerator => {
	if (obj === null || typeof obj !== 'object') {
		return false;
	}

	if (!('getName' in obj) || typeof (obj as Record<string, unknown>).getName !== 'function') {
		return false;
	}

	if (
		!('getTemplateDir' in obj) ||
		typeof (obj as Record<string, unknown>).getTemplateDir !== 'function'
	) {
		return false;
	}

	// eslint-disable-next-line sonarjs/prefer-single-boolean-return
	if (!('generate' in obj) || typeof (obj as Record<string, unknown>).generate !== 'function') {
		return false;
	}

	return true;
};

export const isGeneratorPackage = (obj: unknown): obj is IGeneratorPackage => {
	if (obj === null || typeof obj !== 'object') {
		return false;
	}

	// eslint-disable-next-line sonarjs/prefer-single-boolean-return
	if (!('generators' in obj) || !Array.isArray((obj as Record<string, unknown>).generators)) {
		return false;
	}

	return true;
};
