import http from 'http';
import { ILoadService } from './load.model';

export class HttpLoadService implements ILoadService {
	isSupported(path: string): boolean {
		try {
			return new URL(path).protocol === 'http:';
		} catch {
			return false;
		}
	}

	async load(path: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const url = new URL(path);

			const options: http.RequestOptions = {
				host: url.host,
				path: url.pathname,
			};

			http.get(options, res => {
				const data: Uint8Array[] = [];

				res.on('data', chunk => {
					data.push(chunk);
				});

				res.on('end', () => {
					const buffer = Buffer.concat(data);
					resolve(buffer);
				});

				res.on('error', reject);
			});
		});
	}
}
