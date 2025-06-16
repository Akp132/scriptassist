import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { BatchUpdateTasksCommand } from './batch-update-tasks.command';
import { BatchAction } from '../dto/batch-action.enum';
import { Retryable } from '../../../common/decorators/retryable.decorator';
import { TaskStatus } from '../enums/task-status.enum';

@CommandHandler(BatchUpdateTasksCommand)
export class BatchUpdateTasksHandler implements ICommandHandler<BatchUpdateTasksCommand> {
  private readonly logger = new Logger(BatchUpdateTasksHandler.name);
  constructor(
    @InjectRepository(Task) private readonly repo: Repository<Task>,
  ) {}

  @Retryable(3, 150)
  async execute(command: BatchUpdateTasksCommand): Promise<any> {
    const { taskIds, action, currentUser } = command;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      throw new NotFoundException('No task IDs provided');
    }
    // Admins can operate on any, users only on their own
    let allowedTaskIds = taskIds;
    if (currentUser.role !== 'admin') {
      const userTasks = await this.repo.find({
        where: { id: In(taskIds), userId: currentUser.id },
        select: ['id'],
      });
      allowedTaskIds = userTasks.map(t => t.id);
      if (allowedTaskIds.length === 0) {
        throw new ForbiddenException('No authorized tasks');
      }
    }
    if (action === BatchAction.MARK_COMPLETE) {
      await this.repo.createQueryBuilder()
        .update(Task)
        .set({ status: TaskStatus.COMPLETED })
        .whereInIds(allowedTaskIds)
        .execute();
      return { updated: allowedTaskIds.length };
    } else if (action === BatchAction.MARK_INCOMPLETE) {
      await this.repo.createQueryBuilder()
        .update(Task)
        .set({ status: TaskStatus.PENDING })
        .whereInIds(allowedTaskIds)
        .execute();
      return { updated: allowedTaskIds.length };
    } else if (action === BatchAction.DELETE) {
      await this.repo.createQueryBuilder()
        .delete()
        .from(Task)
        .whereInIds(allowedTaskIds)
        .execute();
      return { deleted: allowedTaskIds.length };
    } else {
      throw new NotFoundException('Unknown batch action');
    }
  }
}
