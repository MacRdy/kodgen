import { SchemaEntity } from '../../entities/shared.model';
import { CommonServicePathService } from '../common/common-parser-path.service';
import { V31ParserPathService } from './v31-parser-path.service';

const parseSchemaEntity = jest.fn<SchemaEntity, []>();

describe('v31-parser-path', () => {
	it('should call common parser', () => {
		const parseSpy = jest.spyOn(CommonServicePathService, 'parse');

		const service = new V31ParserPathService(parseSchemaEntity);

		service.parse('', {});

		expect(parseSpy).toHaveBeenCalledTimes(1);

		parseSpy.mockRestore();
	});
});
