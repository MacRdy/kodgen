import { Model } from '../../entities/shared.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { V3ParserPathService } from './v3-parser-path.service';

const parseSchemaEntity = jest.fn<Model, []>();

describe('v3-parser-path-service', () => {
	beforeEach(() => {
		parseSchemaEntity.mockReset();
	});

	it('should call common parser', () => {
		const parseSpy = jest.spyOn(CommonServicePathService, 'parse');

		const service = new V3ParserPathService(parseSchemaEntity);

		service.parse('', {});

		expect(parseSpy).toHaveBeenCalledTimes(1);

		parseSpy.mockRestore();
	});
});
