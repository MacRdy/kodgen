export interface ILoadService {
	isSupported(path: string): boolean;
	load(path: string): Promise<Buffer>;
}
