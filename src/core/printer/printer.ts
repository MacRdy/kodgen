import { EOL } from 'os';

type PrinterLevel = 'info' | 'verbose';

export class Printer {
	private static level: PrinterLevel = 'info';

	private static readonly styles = {
		reset: '\x1b[0m',
		bright: '\x1b[1m',
		yellow: '\x1b[33m',
		blue: '\x1b[34m',
		cyan: '\x1b[36m',
	} as const;

	static setLevel(level: PrinterLevel): void {
		this.level = level;
	}

	static verbose(message: string): void {
		if (this.level === 'verbose') {
			process.stdout.write(this.formatMessage(message, this.styles.cyan));
		}
	}

	static info(message: string): void {
		process.stdout.write(this.formatMessage(message, this.styles.bright, this.styles.blue));
	}

	static warn(message: string): void {
		process.stdout.write(this.formatMessage(message, this.styles.yellow));
	}

	private static formatMessage(message: string, ...styles: string[]): string {
		return styles.length
			? `${styles.join('')}${message}${this.styles.reset}${EOL}`
			: `${message}${EOL}`;
	}
}
