import { IConfig } from './config.model';

export class Config {
	private static instance?: Config;

	static get(): IConfig {
		if (!this.instance) {
			throw new Error('Config not initialized.');
		}

		return this.instance.get();
	}

	static init(config: IConfig): void {
		if (this.instance) {
			throw new Error('Config already initialized.');
		}

		this.instance = new Config(config);
	}

	static reset(): void {
		this.instance = undefined;
	}

	private readonly config: IConfig;

	private constructor(config: IConfig) {
		this.config = config;
	}

	get(): IConfig {
		return this.config;
	}
}
