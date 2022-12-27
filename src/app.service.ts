import { Config } from './core/config/config';
import { IConfig } from './core/config/config.model';
import { Hooks } from './core/hooks/hooks';

export class AppService {
	async init(config: IConfig): Promise<void> {
		Config.init(config);

		await Hooks.init(config.hooksFile);
	}
}
