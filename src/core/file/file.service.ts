import fs from 'fs';
import fsPromises from 'fs/promises';
import pathLib from 'path';
import vm from 'vm';

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

	async loadJson<T>(path: string): Promise<T> {
		try {
			const raw = await this.readFile(path);

			return JSON.parse(raw.toString('utf-8')) as T;
		} catch {
			throw new Error(`File '${path}' could not be loaded.`);
		}
	}

	async loadJs<T>(path: string): Promise<T> {
		try {
			const raw = await this.readFile(path);

			const relativeRequire = (id: string) =>
				require(pathLib.resolve(pathLib.join(pathLib.dirname(path), id)));

			const context = vm.createContext({
				__filename: pathLib.resolve(path),
				__dirname: pathLib.resolve(pathLib.dirname(path)),
				require: relativeRequire,
				module: { exports: {} },
			});

			vm.runInContext(raw.toString('utf-8'), context, { filename: path });

			return context.module?.exports;
		} catch (e) {
			throw new Error(`File '${path}' could not be loaded.`);
		}
	}
}
