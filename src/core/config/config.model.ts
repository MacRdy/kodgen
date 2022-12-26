export interface IConfig {
	readonly generator: string;
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
}
