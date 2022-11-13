import { IJSDocConfig, IJSDocConfigParam, IJSDocConfigReturns, JSDocRecords } from './jsdoc.model';

export class JSDocService {
	constructor(private indention = '\t') {}

	setIndention(indention: string): void {
		this.indention = indention;
	}

	build(config: IJSDocConfig, indentLevel = 0): string {
		const records = new JSDocRecords();

		if (config.deprecated) {
			records.set('@deprecated');
		}

		if (config.summaries) {
			this.setSummaries(records, config.summaries);
		}

		if (config.descriptions) {
			this.setDescriptions(records, config.descriptions);
		}

		if (config.params) {
			this.setParams(records, config.params);
		}

		if (config.returns) {
			this.setReturns(records, config.returns);
		}

		return this.print(records, indentLevel);
	}

	private setSummaries(records: JSDocRecords, summaries: string[]): void {
		for (const summary of summaries) {
			records.set(JSDocRecords.Keys.summary, summary);
		}
	}

	private setDescriptions(records: JSDocRecords, descriptions: string[]): void {
		for (const description of descriptions) {
			records.set(JSDocRecords.Keys.description, description);
		}
	}

	private setParams(records: JSDocRecords, params: IJSDocConfigParam[]): void {
		for (const param of params) {
			const name = param.optional ? `[${param.name}]` : param.name;
			const type = param.type ? `{${param.type}}` : '';
			const description = param.description ? `- ${param.description}` : '';

			records.set(
				JSDocRecords.Keys.param,
				[type, name, description].filter(Boolean).join(' '),
			);
		}
	}

	private setReturns(records: JSDocRecords, returns: IJSDocConfigReturns): void {
		if (returns?.type || returns?.description) {
			const type = returns.type ? `{${returns.type}}` : '';
			const description = returns.description ? returns.description : '';

			records.set(JSDocRecords.Keys.returns, [type, description].filter(Boolean).join(' '));
		}
	}

	private print(records: JSDocRecords, indentLevel: number): string {
		const indention = this.indention.repeat(indentLevel);

		const recordsObj = records.get();

		const justInfo =
			Object.keys(recordsObj).length === 1 &&
			(recordsObj[JSDocRecords.Keys.summary]?.length === 1 ||
				recordsObj[JSDocRecords.Keys.description]?.length === 1);

		const getResult = (section: string, content: string) =>
			justInfo ? content : `${section} ${content}`;

		const rawLines = Object.entries(recordsObj).reduce<string[]>((acc, [section, content]) => {
			if (!content.length) {
				return [...acc, section];
			}

			return [...acc, ...content.map(x => getResult(section, x))];
		}, []);

		const lines = this.prepare(rawLines);

		if (!lines.length) {
			return '';
		} else if (lines.length === 1) {
			return `${indention}/** ${lines[0]} */`;
		}

		return [`${indention}/**`, ...lines.map(x => ` * ${x}`), ' */'].join(`\n${indention}`);
	}

	private prepare(lines: string[]): string[] {
		const newLines: string[] = [];

		for (const line of lines) {
			const subLines = line
				.split('\n')
				.map(x => x.trim())
				.filter(Boolean);

			newLines.push(...subLines);
		}

		return newLines;
	}
}
