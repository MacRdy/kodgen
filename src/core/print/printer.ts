import { EOL } from 'os';

export class Printer {
	static info(message: string): void {
		process.stdout.write(this.formatMessage(message));
	}

	static warn(message: string): void {
		process.stdout.write(this.formatMessage(message, '[33m'));
	}

	private static formatMessage(message: string, color?: string): string {
		const messageLine = message + EOL;
		return color ? `\x1b${color}${messageLine}\x1b[0m` : messageLine;
	}
}
