export interface IGenerateCommandConfigArgs {
	config: string;
}

export interface IGenerateCommandInlineArgs {
	generator: string;
	input: string;
	output: string;
	clean?: boolean;
	templateDir?: string;
	templateDataFile?: string;
	includePaths?: string[];
	excludePaths?: string[];
	hooksFile?: string;
}

export type GenerateCommandArgs = IGenerateCommandConfigArgs | IGenerateCommandInlineArgs;
