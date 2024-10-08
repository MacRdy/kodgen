import https from 'https';
import { ILoadOptions, ILoadService } from '../load.model';

export class HttpsLoadService implements ILoadService<ILoadOptions> {
	isSupported(path: string): boolean {
		try {
			return new URL(path).protocol === 'https:';
		} catch {
			return false;
		}
	}

	async load(path: string, options?: ILoadOptions): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			const requestOptions: https.RequestOptions = {
				rejectUnauthorized: !options?.insecure,
			};

			https.get(path, requestOptions, res => {
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
