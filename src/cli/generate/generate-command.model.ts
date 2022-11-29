export interface IGenerateCommandConfigArgs {
	config: string;
}

export interface IGenerateCommandInlineArgs {
	generator: string;
	input: string;
	insecure?: boolean;
	output: string;
	clean?: boolean;
	templateDir?: string;
	templateDataFile?: string;
	skipTemplates?: string[];
	includePaths?: string[];
	excludePaths?: string[];
	hooksFile?: string;
}

export type GenerateCommandArgs = IGenerateCommandConfigArgs | IGenerateCommandInlineArgs;
