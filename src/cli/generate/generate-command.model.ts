export interface IGenerateCommandConfigArgs {
	config: string;
}

export interface IGenerateCommandInlineArgs {
	generator: string;
	input: string;
	output: string;
	clean?: boolean;
	templateDir?: string;
}

export type GenerateCommandArgs = IGenerateCommandConfigArgs | IGenerateCommandInlineArgs;
