import Ajv from 'ajv';
import configSchema from '../../../assets/config-schema.json';
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

		this.validate(config);

		this.instance = new Config(config);
	}

	static reset(): void {
		this.instance = undefined;
	}

	private static validate(data: IConfig): void {
		const validate = new Ajv({ allErrors: true }).compile<IConfig>(configSchema);

		if (!validate(data)) {
			const message = validate.errors
				?.map(e => [e.instancePath, e.message].filter(Boolean).join(' '))
				.join('\n- ');

			throw new Error(`Invalid configuration:\n- ${message ?? 'Unknown error'}`);
		}
	}

	private readonly config: IConfig;

	private constructor(config: IConfig) {
		this.config = config;
	}

	get(): IConfig {
		return this.config;
	}
}
