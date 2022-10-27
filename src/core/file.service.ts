import fs from 'fs';
import path from 'path';

export class FileService {
	async createFile(filePath: string, content: string): Promise<void> {
		const dir = path.join(...filePath.split(path.sep).slice(0, -1));

		if (!fs.existsSync(dir)) {
			await fs.promises.mkdir(dir, { recursive: true });
		}

		await fs.promises.writeFile(filePath, content, { flag: 'w' });
	}

	removeDirectory(dir: string): void {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}
