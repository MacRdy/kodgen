import { EOL } from 'os';

export class PrintService {
	private static instance?: PrintService;

	static getInstance(): PrintService {
		if (!this.instance) {
			this.instance = new PrintService();
		}

		return this.instance;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	print(message: string): void {
		process.stdout.write(message);
	}

	println(message: string): void {
		this.print(message + EOL);
	}
}
