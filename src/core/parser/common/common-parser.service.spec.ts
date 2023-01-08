import { NullModelDef } from '../../../core/entities/schema-entities/null-model-def.model';
import { SimpleModelDef } from '../../../core/entities/schema-entities/simple-model-def.model';
import { ParserRepositoryService } from '../parser-repository.service';
import { ICommonParserSchemaService, OpenApiSchemaObject } from './common-parser.model';
import { CommonParserService } from './common-parser.service';

describe('common-parser', () => {
	it('should select specific entities', () => {
		const entity1 = new SimpleModelDef('number');
		const entity2 = new SimpleModelDef('string');
		const entity3 = new NullModelDef();

		const entities = [entity1, entity2, entity3];

		expect(CommonParserService.selectEntities(entities, SimpleModelDef)).toStrictEqual([
			entity1,
			entity2,
		]);

		expect(CommonParserService.selectEntities(entities, NullModelDef)).toStrictEqual([entity3]);
	});

	it('should parse new schema model', () => {
		const repositoryMock: ParserRepositoryService<unknown, unknown> = {
			addEntity: jest.fn(),
			getAllEntities: jest.fn(),
			getEntity: jest.fn(),
			hasSource: jest.fn(),
		} as unknown as ParserRepositoryService<unknown, unknown>;

		jest.mocked(repositoryMock.hasSource).mockReturnValueOnce(false);

		const getInstanceMock = jest.spyOn(ParserRepositoryService, 'getInstance');
		getInstanceMock.mockReturnValueOnce(repositoryMock);

		const schemaServiceMock: ICommonParserSchemaService<OpenApiSchemaObject> = {
			parse: jest.fn(),
		};

		CommonParserService.parseSchemaEntity(schemaServiceMock, {});

		expect(repositoryMock.hasSource).toBeCalledTimes(1);
		expect(repositoryMock.getEntity).not.toBeCalled();

		expect(schemaServiceMock.parse).toBeCalledWith({}, undefined);

		getInstanceMock.mockRestore();
	});

	it('should return schema model from repository', () => {
		const repositoryMock: ParserRepositoryService<unknown, unknown> = {
			addEntity: jest.fn(),
			getAllEntities: jest.fn(),
			getEntity: jest.fn(),
			hasSource: jest.fn(),
		} as unknown as ParserRepositoryService<unknown, unknown>;

		jest.mocked(repositoryMock.hasSource).mockReturnValueOnce(true);

		const getInstanceMock = jest.spyOn(ParserRepositoryService, 'getInstance');
		getInstanceMock.mockReturnValueOnce(repositoryMock);

		const schemaServiceMock: ICommonParserSchemaService<OpenApiSchemaObject> = {
			parse: jest.fn(),
		};

		CommonParserService.parseSchemaEntity(schemaServiceMock, {});

		expect(repositoryMock.hasSource).toBeCalledTimes(1);
		expect(repositoryMock.getEntity).toBeCalledWith({});

		expect(schemaServiceMock.parse).not.toBeCalled();

		getInstanceMock.mockRestore();
	});
});
