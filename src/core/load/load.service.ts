import jsYaml, { JSON_SCHEMA } from 'js-yaml';
import { OpenAPI } from 'openapi-types';
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

	async load(path: string): Promise<OpenAPI.Document> {
		const loader = this.loaders.find(x => x.isSupported(path));

		if (!loader) {
			throw new Error('Resource could not be loaded');
		}

		const buffer = await loader.load(path);
		const resource = buffer.toString('utf-8');

		return jsYaml.load(resource, { schema: JSON_SCHEMA }) as OpenAPI.Document;
	}
}
