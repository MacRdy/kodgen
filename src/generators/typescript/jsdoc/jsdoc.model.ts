export class JSDocRecords {
	private readonly records: Record<string, string[]> = {};

	get(): Readonly<Record<string, readonly string[]>> {
		return this.records;
	}

	set(section: string, content?: string): void {
		if (!this.records[section]) {
			this.records[section] = [];
		}

		if (content) {
			this.records[section]?.push(content);
		}
	}
}

export interface IJSDocMethodParam {
	name: string;
	type?: string;
	description?: string;
}

export interface IJSDocMethodReturns {
	type?: string;
	description?: string;
}

export interface IJSDocMethod {
	name?: string;
	descriptions?: string[];
	summaries?: string[];
	params?: IJSDocMethodParam[];
	returns?: IJSDocMethodReturns;
	deprecated?: boolean;
}
