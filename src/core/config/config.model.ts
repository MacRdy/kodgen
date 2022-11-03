export interface IConfig {
	readonly generator: string;
	readonly input: string;
	readonly output: string;
	readonly clean?: boolean;
	readonly templateDir?: string;
	readonly templateDataFile?: string;
	readonly includePaths?: readonly string[];
	readonly excludePaths?: readonly string[];
	readonly hooksFile?: string;
}
