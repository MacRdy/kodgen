export interface IGenerateCommandArgs {
	config?: string;
	generator?: string;
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
}
