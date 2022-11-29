import https from 'https';
import { ILoadService } from './load.model';

export class HttpsLoadService implements ILoadService {
	isSupported(path: string): boolean {
		return path.startsWith('https://');
	}

	async load(path: string): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const url = new URL(path);

			const options: https.RequestOptions = {
				host: url.host,
				path: url.pathname,
				rejectUnauthorized: false,
			};

			https.get(options, res => {
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
