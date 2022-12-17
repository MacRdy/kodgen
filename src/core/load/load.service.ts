import { FileLoadService } from './file-load.service';
import { HttpLoadService } from './http-load.service';
import { HttpsLoadService } from './https-load.service';
import { ILoadService } from './load.model';

export class LoadService {
	private readonly loaders: ILoadService[] = [
		new FileLoadService(),
		new HttpLoadService(),
		new HttpsLoadService(),
	];

	async load(path: string): Promise<Buffer> {
		const loader = this.loaders.find(x => x.isSupported(path));

		if (!loader) {
			throw new Error('Resource could not be loaded');
		}

		return loader.load(path);
	}
}
