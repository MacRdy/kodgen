import { EOL } from 'os';
import { PrinterLevel } from './printer.model';

export class Printer {
	private static level = PrinterLevel.Warning;

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

	static warn(message: string): void {
		if (this.level >= PrinterLevel.Warning) {
			process.stdout.write(this.formatMessage(message, this.styles.yellow));
		}
	}

	static info(message: string): void {
		if (this.level >= PrinterLevel.Info) {
			process.stdout.write(this.formatMessage(message, this.styles.bright, this.styles.blue));
		}
	}

	static verbose(message: string): void {
		if (this.level >= PrinterLevel.Verbose) {
			process.stdout.write(this.formatMessage(message, this.styles.cyan));
		}
	}

	private static formatMessage(message: string, ...styles: string[]): string {
		return styles.length
			? `${styles.join('')}${message}${this.styles.reset}${EOL}`
			: `${message}${EOL}`;
	}
}
