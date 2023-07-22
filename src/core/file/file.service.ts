import fs from 'fs';
import fsPromises from 'fs/promises';
import pathLib from 'path';

export class FileService {
	exists(path: string): boolean {
		return fs.existsSync(path);
	}

	async createFile(filePath: string, content: string): Promise<void> {
		const dir = pathLib.dirname(filePath);

		if (!fs.existsSync(dir)) {
			await fsPromises.mkdir(dir, { recursive: true });
		}

		await fsPromises.writeFile(filePath, content, { flag: 'w' });
	}

	async removeDirectory(dir: string): Promise<void> {
		await fsPromises.rm(dir, { recursive: true, force: true });
	}

	async readFile(path: string): Promise<Buffer> {
		return fsPromises.readFile(path);
	}

	async loadFile<T>(path: string): Promise<T> {
		return path.endsWith('.json') ? this.loadJson<T>(path) : this.loadJs<T>(path);
	}

	loadModule<T>(path: string): T {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		return require(path).default;
	}

	private async loadJson<T>(path: string): Promise<T> {
		const raw = await this.readFile(path);

		return JSON.parse(raw.toString('utf-8')) as T;
	}

	private loadJs<T>(path: string): T {
		const resolvedPath = pathLib.resolve(path);

		return require(resolvedPath);
	}
}
