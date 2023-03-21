import { normalizePath } from './dereference.model';

describe('dereference-model', () => {
	it('should get resolved value if exists', () => {
		// TODO getDereferenceResolvedValueOrDefault
	});

	describe('normalize-path', () => {
		it('should resolve local paths', () => {
			const x1 = normalizePath('external.json', 'swagger.json');
			expect(x1).toStrictEqual('external.json');

			const x2 = normalizePath('folder/external.json', 'swagger.json');
			expect(x2).toStrictEqual('folder/external.json');

			const x3 = normalizePath('folder2/external2.json', 'folder1/external1.json');
			expect(x3).toStrictEqual('folder1/folder2/external2.json');

			const x4 = normalizePath('../swagger.json', 'folder/external.json');
			expect(x4).toStrictEqual('swagger.json');
		});
	});
});
