import { EOL } from 'os';
import { Config } from '../config/config';

export class Printer {
	private static readonly styles = {
		reset: '\x1b[0m',
		bright: '\x1b[1m',
		yellow: '\x1b[33m',
		blue: '\x1b[34m',
		cyan: '\x1b[36m',
	} as const;

	static verbose(message: string): void {
		if (Config.get().verbose) {
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
