export interface ILoadService<T = unknown> {
	isSupported(path: string): boolean;
	load(path: string, options?: T): Promise<Buffer>;
}

export interface ILoadOptions {
	readonly insecure?: boolean;
}
