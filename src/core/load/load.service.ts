import jsYaml, { JSON_SCHEMA } from 'js-yaml';
import pathLib from 'path';
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

	normalizePath(path: string, previousPath?: string): string {
		if (previousPath) {
			const fileLoadService = new FileLoadService();

			const isLocalPath = fileLoadService.isSupported(path);
			const isLocalPreviousPath = fileLoadService.isSupported(previousPath);

			const resolveLocal = (current: string, previous: string): string => {
				const dir = pathLib.posix.dirname(previous);

				return pathLib.posix.join(dir, current);
			};

			if (!isLocalPreviousPath) {
				const previousUrl = new URL(previousPath);

				if (isLocalPath && path.startsWith('//')) {
					return `${previousUrl.protocol}${path}`;
				} else if (isLocalPath) {
					const newPath = resolveLocal(path, previousUrl.pathname);

					return `${previousUrl.origin}${newPath}`;
				}

				return path;
			}

			return resolveLocal(path, previousPath);
		}

		return path;
	}
}
