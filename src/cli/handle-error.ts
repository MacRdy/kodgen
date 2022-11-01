import { EOL } from 'os';

export const handleError = (message: string, error: Error): never => {
	const errorMessage = error?.message || message || 'An error has occurred';

	process.stderr.write(`Error: ${errorMessage}` + EOL);
	process.stderr.write(`Hint: Use the '--help', option to get help about the usage` + EOL);

	process.exit(1);
};
