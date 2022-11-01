export interface IGenerateCommandConfigOptions {
	config: string;
}

export interface IGenerateCommandArgsOptions {
	generator: string;
	input: string;
	output: string;
	clean?: boolean;
	templateFolder?: string;
}

export type GenerateCommandOptions = IGenerateCommandConfigOptions | IGenerateCommandArgsOptions;
