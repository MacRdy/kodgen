export interface IGenerateCommandArgs {
	config?: string;
	generator?: string;
	input?: string;
	insecure?: boolean;
	output?: string;
	clean?: boolean;
	templateDir?: string;
	templateDataFile?: string;
	skipTemplates?: string[];
	includePaths?: string[];
	excludePaths?: string[];
	hooksFile?: string;
}
