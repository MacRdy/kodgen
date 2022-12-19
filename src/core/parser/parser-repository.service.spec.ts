import { ParserRepositoryService } from './parser-repository.service';

class TestSource {}
class TestEntity {}

describe('parser-repository', () => {
	it('should link entities correctly', () => {
		const service = ParserRepositoryService.getInstance<TestSource, TestEntity>();

		const s1 = new TestSource();
		const s2 = new TestSource();

		const e1 = new TestEntity();
		const e2 = new TestEntity();

		expect(service.hasSource(s1)).toStrictEqual(false);

		service.addEntity(e1, s1);
		service.addEntity(e2, s2);

		expect(service.hasSource(s1)).toStrictEqual(true);

		expect(service.getEntity(s1)).toBe(e1);
	});

	it('should return all known entities by type', () => {
		const service = ParserRepositoryService.getInstance<TestSource, TestEntity>();

		const s1 = new TestSource();
		const s2 = new TestSource();

		const e1 = new TestEntity();
		const e2 = new TestEntity();

		service.addEntity(e1, s1);
		service.addEntity(e2, s2);

		const entities = service.getAllEntities();

		expect(entities[0] === e1).toBeTruthy();
		expect(entities[1] === e2).toBeTruthy();
	});
});
