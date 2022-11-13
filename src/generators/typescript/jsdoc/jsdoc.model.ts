export class JSDocRecords {
	static readonly Keys = {
		deprecated: '@deprecated',
		summary: '@summary',
		description: '@description',
		param: '@param',
		returns: '@returns',
	};

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

export interface IJSDocConfigParam {
	name: string;
	type?: string;
	optional?: boolean;
	description?: string;
}

export interface IJSDocConfigReturns {
	type?: string;
	description?: string;
}

export interface IJSDocConfig {
	descriptions?: string[];
	summaries?: string[];
	params?: IJSDocConfigParam[];
	returns?: IJSDocConfigReturns;
	deprecated?: boolean;
}
