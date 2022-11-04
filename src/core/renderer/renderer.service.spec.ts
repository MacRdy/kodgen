import ejs from 'ejs';
import { RendererService } from './renderer.service';

jest.mock('ejs');

describe('renderer', () => {
	it('should call renderFile function', async () => {
		const service = new RendererService();

		const mockedEjs = jest.mocked(ejs);

		mockedEjs.renderFile.mockResolvedValue('');

		await service.render('path');

		expect(ejs.renderFile).toHaveBeenCalled();
	});

	it('should return renderer extension', () => {
		const rendererService = new RendererService();

		expect(rendererService.getExtension()).toStrictEqual('.ejs');
	});
});
