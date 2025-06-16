import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
let getQueueToken: any;
try {
  getQueueToken = require('@nestjs/bull').getQueueToken;
} catch {
  getQueueToken = (name: string) => `BullQueue_${name}`;
}
import { Repository } from 'typeorm';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { TaskStatus } from '../src/modules/tasks/enums/task-status.enum';
import { TaskPriority } from '../src/modules/tasks/enums/task-priority.enum';
import { DataSource } from 'typeorm';

describe('TasksService', () => {
  let service: TasksService;
  let repo: jest.Mocked<Repository<Task>>;
  let queue: any;
  let dataSource: any;
  let queryRunner: any;
  let manager: any;

  beforeEach(async () => {
    manager = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };
    queryRunner = {
      connect: jest.fn(),
      release: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      manager,
    };
    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    };
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({ raw: [{ totalCount: 1 }], entities: [{ id: '1' }] }),
      }),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    } as any;
    queue = { add: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: getQueueToken('task-processing'), useValue: queue },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get(TasksService);
  });

  describe('create', () => {
    it('should create and save a task with correct fields', async () => {
      const dto = { title: 'Test', userId: 'u1' };
      const created = {
        id: 't1',
        title: 'Test',
        userId: 'u1',
        description: '',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(),
        user: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const saved = { ...created };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(saved);
      const result = await service.create(dto as any);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(saved);
    });
    it('should add a job to the queue after save', async () => {
      const dto = { title: 'Test', userId: 'u1' };
      const created = {
        id: 't1',
        title: 'Test',
        userId: 'u1',
        description: '',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(),
        user: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const saved = { ...created };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(saved);
      await service.create(dto as any);
      expect(queue.add).toHaveBeenCalledWith('task-status-update', { taskId: 't1', status: TaskStatus.PENDING });
    });
  });

  describe('findAllFiltered', () => {
    it('should return paginated tasks with correct filters', async () => {
      const query = { page: 1, limit: 10 };
      const user = { id: 'u1', role: 'user' };
      const result = await service.findAllFiltered(query as any, user);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
    });
    it('should respect status and priority filters', async () => {
      const query = { status: TaskStatus.COMPLETED, priority: TaskPriority.HIGH, page: 1, limit: 5 };
      const user = { id: 'u1', role: 'user' };
      await service.findAllFiltered(query as any, user);
      const qb = repo.createQueryBuilder.mock.results[0].value;
      expect(qb.andWhere).toHaveBeenCalled();
    });
    it('should handle empty result set', async () => {
      repo.createQueryBuilder.mockReturnValueOnce({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
      } as any);
      const query = { page: 1, limit: 10 };
      const user = { id: 'u1', role: 'user' };
      const result = await service.findAllFiltered(query as any, user);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
