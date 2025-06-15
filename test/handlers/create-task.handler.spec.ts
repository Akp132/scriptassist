import { CreateTaskHandler } from '../../src/modules/tasks/commands/create-task.handler';
import { CreateTaskCommand } from '../../src/modules/tasks/commands/create-task.command';
import { Repository } from 'typeorm';
import { Task } from '../../src/modules/tasks/entities/task.entity';

const mockRepo = () => ({ create: jest.fn(), save: jest.fn() });

describe('CreateTaskHandler', () => {
  it('should create and save a task', async () => {
    const repo: any = mockRepo();
    const handler = new CreateTaskHandler(repo, { publish: jest.fn() } as any);
    const dto = { title: 'Test', userId: 'u1' } as any;
    const task = { id: 't1', ...dto };
    repo.create.mockReturnValue(task);
    repo.save.mockResolvedValue(task);
    const result = await handler.execute(new CreateTaskCommand(dto));
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalledWith(task);
    expect(result).toEqual(task);
  });
});
