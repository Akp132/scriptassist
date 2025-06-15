import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetTaskByIdHandler } from '@modules/tasks/queries/get-task-by-id.handler';
import { GetTaskByIdQuery } from '@modules/tasks/queries/get-task-by-id.query';
import { Task } from '@modules/tasks/entities/task.entity';

describe('GetTaskByIdHandler', () => {
  it('returns task if authorised', async () => {
    const task = { id: 't1', userId: 'u1' } as Task;
    const mockRepo = { findOne: jest.fn(async () => task) } as unknown as Repository<Task>;
    const module = await Test.createTestingModule({
      providers: [
        GetTaskByIdHandler,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
      ],
    }).compile();
    const handler = module.get(GetTaskByIdHandler);
    const result = await handler.execute(new GetTaskByIdQuery('t1', { id: 'u1', role: 'user' }));
    expect(result).toBe(task);
  });

  it('throws an error if task not found', async () => {
    const mockRepo = { findOne: jest.fn(async () => null) } as unknown as Repository<Task>;
    const module = await Test.createTestingModule({
      providers: [
        GetTaskByIdHandler,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
      ],
    }).compile();
    const handler = module.get(GetTaskByIdHandler);
    await expect(handler.execute(new GetTaskByIdQuery('t2', { id: 'u1', role: 'user' })))
      .rejects
      .toThrow('Task not found');
  });

  it('throws an error if not authorised', async () => {
    const task = { id: 't1', userId: 'u1' } as Task;
    const mockRepo = { findOne: jest.fn(async () => task) } as unknown as Repository<Task>;
    const module = await Test.createTestingModule({
      providers: [
        GetTaskByIdHandler,
        { provide: getRepositoryToken(Task), useValue: mockRepo },
      ],
    }).compile();
    const handler = module.get(GetTaskByIdHandler);
    await expect(handler.execute(new GetTaskByIdQuery('t1', { id: 'u2', role: 'user' })))
      .rejects
      .toThrow('Not allowed');
  });
});
