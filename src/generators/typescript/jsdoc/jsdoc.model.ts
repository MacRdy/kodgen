export interface IJSDocMethodParam {
	name: string;
	type?: string;
	description?: string;
}

export interface IJSDocMethodReturn {
	type?: string;
	description?: string;
}

export interface IJSDocMethod {
	name?: string;
	descriptions?: string[];
	summaries?: string[];
	params?: IJSDocMethodParam[];
	return?: IJSDocMethodReturn;
	deprecated?: boolean;
}
