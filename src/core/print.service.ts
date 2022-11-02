import { EOL } from 'os';

export class PrintService {
	print(message: string): void {
		process.stdout.write(message);
	}

	println(message: string): void {
		this.print(message + EOL);
	}
}
