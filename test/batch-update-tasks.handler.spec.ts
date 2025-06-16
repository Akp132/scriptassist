import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BatchUpdateTasksHandler } from '../src/modules/tasks/commands/batch-update-tasks.handler';
import { BatchUpdateTasksCommand } from '../src/modules/tasks/commands/batch-update-tasks.command';
import { BatchAction } from '../src/modules/tasks/dto/batch-action.enum';
import { Task } from '../src/modules/tasks/entities/task.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionService } from '../src/common/services/transaction.service';

describe('BatchUpdateTasksHandler', () => {
  let handler: BatchUpdateTasksHandler;
  let repo: any;
  let transactionService: any;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
      })),
    };
    transactionService = {
      runInTransaction: jest.fn(fn => fn({ getRepository: () => repo })),
    };
    const module = await Test.createTestingModule({
      providers: [
        BatchUpdateTasksHandler,
        { provide: getRepositoryToken(Task), useValue: repo },
        { provide: TransactionService, useValue: transactionService },
      ],
    })
      .overrideProvider(TransactionService)
      .useValue(transactionService)
      .compile();
    handler = module.get(BatchUpdateTasksHandler);
  });

  it('should update all tasks to complete', async () => {
    repo.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);
    const command = new BatchUpdateTasksCommand(['1', '2'], BatchAction.MARK_COMPLETE, { id: 'admin', role: 'admin' });
    const result = await handler.execute(command);
    expect(result).toEqual({ updated: 2 });
  });

  it('should delete tasks', async () => {
    repo.find.mockResolvedValue([{ id: '1' }]);
    const command = new BatchUpdateTasksCommand(['1'], BatchAction.DELETE, { id: 'admin', role: 'admin' });
    const result = await handler.execute(command);
    expect(result).toEqual({ deleted: 1 });
  });

  it('should throw NotFoundException for unknown action', async () => {
    repo.find.mockResolvedValue([{ id: '1' }]);
    const command = new BatchUpdateTasksCommand(['1'], 'UNKNOWN' as any, { id: 'admin', role: 'admin' });
    await expect(handler.execute(command)).rejects.toThrow(/Unknown batch action/);
  });

  it('should throw NotFoundException for empty task list', async () => {
    const command = new BatchUpdateTasksCommand([], BatchAction.MARK_COMPLETE, { id: 'admin', role: 'admin' });
    await expect(handler.execute(command)).rejects.toThrow(/No task IDs provided/);
  });

  it('should throw ForbiddenException if user not authorized', async () => {
    repo.find.mockResolvedValue([]);
    const command = new BatchUpdateTasksCommand(['1'], BatchAction.MARK_COMPLETE, { id: 'u1', role: 'user' });
    await expect(handler.execute(command)).rejects.toThrow(/No authorized tasks/);
  });
});
