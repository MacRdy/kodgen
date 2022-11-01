import { AppService } from './app.service';

const appService = new AppService();

void appService.start({
	url: '../swagger-api.json',
	generator: 'ng-typescript',
	outputPath: './build/codegen',
	clean: true,
});
