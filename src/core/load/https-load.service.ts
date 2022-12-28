import https from 'https';
import { ILoadOptions, ILoadService } from './load.model';

export class HttpsLoadService implements ILoadService<ILoadOptions> {
	isSupported(path: string): boolean {
		return path.startsWith('https://');
	}

	async load(path: string, options?: ILoadOptions): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const url = new URL(path);

			const requestOptions: https.RequestOptions = {
				host: url.host,
				path: url.pathname,
				rejectUnauthorized: !options?.insecure,
			};

			https.get(requestOptions, res => {
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
