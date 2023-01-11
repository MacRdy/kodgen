import Ajv from 'ajv';
import generatorConfigSchema from '../../../assets/generators/ng-typescript-config-schema.json';
import { IDocument } from '../../core/entities/document.model';
import { ImportRegistryService } from '../../core/import-registry/import-registry.service';
import { getAjvValidateErrorMessage } from '../../core/utils';
import { IGenerator, IGeneratorFile } from '../generator.model';
import { TypescriptGeneratorEnumService } from './entities/typescript-generator-enum.service';
import { TypescriptGeneratorModelService } from './entities/typescript-generator-model.service';
import { TypescriptGeneratorPathService } from './entities/typescript-generator-path.service';
import { TypescriptGeneratorNamingService } from './typescript-generator-naming.service';
import { TypescriptGeneratorStorageService } from './typescript-generator-storage.service';
import { ITsGenConfig, ITsGenParameters } from './typescript-generator.model';

export abstract class TypescriptGeneratorService implements IGenerator<ITsGenConfig> {
	private readonly storage = new TypescriptGeneratorStorageService();
	private readonly importRegistry = new ImportRegistryService();
	private readonly namingService = new TypescriptGeneratorNamingService();

	private readonly enumService = new TypescriptGeneratorEnumService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	private readonly modelService = new TypescriptGeneratorModelService(
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	private readonly pathService = new TypescriptGeneratorPathService(
		this.modelService,
		this.storage,
		this.importRegistry,
		this.namingService,
		this.parameters,
	);

	constructor(private readonly parameters: ITsGenParameters) {}

	abstract getName(): string;

	abstract getTemplateDir(): string;

	generate(doc: IDocument, config?: ITsGenConfig): IGeneratorFile[] {
		if (!config) {
			throw new Error('Generator config not defined');
		}

		const files: IGeneratorFile[] = [
			...this.enumService.generate(doc.enums),
			...this.modelService.generate(doc.models, config),
			...this.pathService.generate(doc.paths, doc.servers, doc.tags, config),
		];

		return files.map(x => ({ ...x, path: `${x.path}.ts` }));
	}

	prepareConfig(userConfig?: ITsGenConfig): ITsGenConfig {
		const config: ITsGenConfig = {
			inlinePathParameters: userConfig?.inlinePathParameters ?? true,
			inlineQueryParameters: userConfig?.inlineQueryParameters,
			readonly: userConfig?.readonly ?? true,
		};

		this.validate(config);

		return config;
	}

	private validate(config: ITsGenConfig): void {
		const validate = new Ajv({ allErrors: true }).compile<ITsGenConfig>(generatorConfigSchema);

		if (!validate(config)) {
			throw new Error(
				getAjvValidateErrorMessage(validate.errors, 'Invalid generator configuration'),
			);
		}
	}
}
