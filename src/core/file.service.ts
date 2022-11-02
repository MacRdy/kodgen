import fs from 'fs';
import pathLib from 'path';

export class FileService {
	exists(path: string): boolean {
		return fs.existsSync(path);
	}

	async createFile(filePath: string, content: string): Promise<void> {
		const dir = pathLib.join(pathLib.dirname(filePath));

		if (!fs.existsSync(dir)) {
			await fs.promises.mkdir(dir, { recursive: true });
		}

		await fs.promises.writeFile(filePath, content, { flag: 'w' });
	}

	removeDirectory(dir: string): void {
		fs.rmSync(dir, { recursive: true, force: true });
	}

	async readFile(path: string): Promise<Buffer> {
		return fs.promises.readFile(path);
	}

	async readJson<T>(path: string): Promise<T> {
		try {
			const raw = await this.readFile(path);

			return JSON.parse(raw.toString('utf-8')) as T;
		} catch {
			throw new Error(`File '${path}' could not be read.`);
		}
	}
}
