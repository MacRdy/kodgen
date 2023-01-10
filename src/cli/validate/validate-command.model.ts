export interface IValidateCommandArgs {
	config?: string;
	input?: string;
	insecure?: boolean;
}

export interface IValidateCommandConfig {
	readonly input: string;
	readonly insecure?: boolean;
}
