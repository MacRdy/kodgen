import { IJSDocMethod } from './jsdoc.model';

export class JSDocService {
	constructor(private indention = '\t') {}

	setIndention(indention: string): void {
		this.indention = indention;
	}

	method(config: IJSDocMethod, indentLevel = 0): string {
		const lines: string[] = [];

		if (config.name) {
			lines.push(`@method ${config.name}`);
		} else {
			lines.push('@method');
		}

		if (config.deprecated) {
			lines.push('@deprecated');
		}

		if (config.summary) {
			lines.push(`@summary ${config.summary}`);
		}

		if (config.description) {
			lines.push(`@description ${config.description}`);
		}

		if (config.params?.length) {
			for (const param of config.params) {
				const type = param.type ? ` {${param.type}}` : '';
				const description = param.description ? ` - ${param.description}` : '';

				lines.push(`@param${type} ${param.name}${description}`);
			}
		}

		if (config.return?.type || config.return?.description) {
			const type = config.return.type ? ` {${config.return.type}}` : '';
			const description = config.return.description ? ` ${config.return.description}` : '';

			lines.push(`@returns${type}${description}`);
		}

		return this.print(lines, indentLevel);
	}

	private print(source: string[], indentLevel: number): string {
		const indention = this.indention.repeat(indentLevel);

		const lines = this.prepare(source);

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
