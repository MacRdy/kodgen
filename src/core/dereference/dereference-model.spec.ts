import { normalizePath } from './dereference.model';

describe('dereference-model', () => {
	it('should get resolved value if exists', () => {
		// TODO getDereferenceResolvedValueOrDefault
	});

	describe('normalize-path', () => {
		it('should resolve local paths', () => {
			const x1 = normalizePath('external.json', 'swagger.json');
			expect(x1).toStrictEqual('external.json');

			const x2 = normalizePath('dir/external.json', 'swagger.json');
			expect(x2).toStrictEqual('dir/external.json');

			const x3 = normalizePath('dir2/external2.json', 'dir1/external1.json');
			expect(x3).toStrictEqual('dir1/dir2/external2.json');

			const x4 = normalizePath('../swagger.json', 'dir/external.json');
			expect(x4).toStrictEqual('swagger.json');

			const x5 = normalizePath('swagger.json', 'dir/external.json');
			expect(x5).toStrictEqual('dir/swagger.json');

			const x6 = normalizePath('dir/swagger.json');
			expect(x6).toStrictEqual('dir/swagger.json');
		});

		it('should resolve external paths', () => {
			const x1 = normalizePath('http://example.com/swagger.json');
			expect(x1).toStrictEqual('http://example.com/swagger.json');

			const x2 = normalizePath('external.json', 'http://example.com/swagger.json');
			expect(x2).toStrictEqual('http://example.com/external.json');

			const x3 = normalizePath('dir/external.json', 'http://example.com/swagger.json');
			expect(x3).toStrictEqual('http://example.com/dir/external.json');

			const x4 = normalizePath(
				'https://another-example.com/swagger.json',
				'http://example.com/swagger.json',
			);

			expect(x4).toStrictEqual('https://another-example.com/swagger.json');

			const x5 = normalizePath(
				'//another-example.com/swagger.json',
				'http://example.com/swagger.json',
			);

			expect(x5).toStrictEqual('http://another-example.com/swagger.json');

			const x6 = normalizePath('/swagger.json', 'http://example.com/dir/external.json');
			expect(x6).toStrictEqual('http://example.com/swagger.json');
		});
	});
});
