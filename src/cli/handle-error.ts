import { EOL } from 'os';

const printMessage = (message: string) => {
	process.stderr.write(`Error: ${message}` + EOL);
	process.stderr.write(`Hint: Use the '--help', option to get help about the usage` + EOL);
};

export const handleError = async (message: string, error: Error): Promise<never> => {
	if (message) {
		printMessage(message);
		process.exit(1);
	}

	let errorMessage = 'An error has occurred';

	if (error instanceof Response) {
		const { ErrorMessage } = await error.json();

		if (ErrorMessage) {
			errorMessage = ErrorMessage;
		}
	} else {
		errorMessage = error.message;
	}

	printMessage(errorMessage);
	process.exit(1);
};
