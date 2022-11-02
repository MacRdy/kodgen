import { IConfig } from './config.model';

export class ConfigService {
	private static instance?: ConfigService;

	static getInstance(): ConfigService {
		if (!this.instance) {
			this.instance = new ConfigService();
		}

		return this.instance;
	}

	private config?: IConfig;

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	get(): IConfig {
		if (!this.config) {
			throw new Error('Config not set.');
		}

		return this.config;
	}

	set(config: IConfig): void {
		if (this.config) {
			throw new Error('Config already set');
		}

		this.config = config;
	}
}
