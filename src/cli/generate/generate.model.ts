export interface IGenerateCommandConfigArgs {
	config: string;
}

export interface IGenerateCommandInlineArgs {
	generator: string;
	input: string;
	output: string;
	clean?: boolean;
	templateFolder?: string;
}

export type GenerateCommandArgs = IGenerateCommandConfigArgs | IGenerateCommandInlineArgs;
