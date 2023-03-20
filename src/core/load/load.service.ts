import jsYaml, { JSON_SCHEMA } from 'js-yaml';
import { FileLoadService } from './file-load.service';
import { HttpLoadService } from './http-load.service';
import { HttpsLoadService } from './https-load.service';
import { ILoadOptions, ILoadService } from './load.model';

export class LoadService {
	private readonly loaders: ILoadService[] = [
		new FileLoadService(),
		new HttpLoadService(),
		new HttpsLoadService(),
	];

	constructor(private readonly options?: ILoadOptions) {}

	async load<T>(path: string): Promise<T> {
		const loader = this.loaders.find(x => x.isSupported(path));

		if (!loader) {
			throw new Error('Resource could not be loaded');
		}

		const buffer = await loader.load(path, this.options);
		const resource = buffer.toString('utf-8');

		return jsYaml.load(resource, { schema: JSON_SCHEMA }) as T;
	}
}
