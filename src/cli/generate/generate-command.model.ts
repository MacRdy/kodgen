export interface IGenerateCommandArgs {
	config?: string;
	generator?: string;
	generatorConfigFile?: string;
	input?: string;
	insecure?: boolean;
	skipValidation?: boolean;
	output?: string;
	clean?: boolean;
	templateDir?: string;
	templateDataFile?: string;
	skipTemplates?: string[];
	includePaths?: string[];
	excludePaths?: string[];
	hooksFile?: string;
	verbose?: boolean;
	eol?: string;
}

export interface IGenerateCommandConfig {
	readonly generator: string;
	readonly generatorConfigFile?: string;
	readonly input: string;
	readonly insecure?: boolean;
	readonly skipValidation?: boolean;
	readonly output: string;
	readonly clean?: boolean;
	readonly templateDir?: string;
	readonly templateDataFile?: string;
	readonly skipTemplates?: readonly string[];
	readonly includePaths?: readonly string[];
	readonly excludePaths?: readonly string[];
	readonly hooksFile?: string;
	readonly verbose?: boolean;
	readonly eol?: string;
	generatorConfig?: unknown;
}
