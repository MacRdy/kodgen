import { FileService } from '../../file/file.service';
import { ILoadService } from '../load.model';

export class FileLoadService implements ILoadService {
	private readonly fileService = new FileService();

	isSupported(path: string): boolean {
		try {
			new URL(path);

			return false;
		} catch {
			return true;
		}
	}

	async load(path: string): Promise<Buffer> {
		return this.fileService.readFile(path);
	}
}
