import { FileService } from '../file/file.service';
import { ILoadService } from './load.model';

export class FileLoadService implements ILoadService {
	private readonly fileService = new FileService();

	isSupported(path: string): boolean {
		return !path.startsWith('http://') && !path.startsWith('https://');
	}

	async load(path: string): Promise<Buffer> {
		return this.fileService.readFile(path);
	}
}
