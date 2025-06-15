import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Task } from '../entities/task.entity';
import { BulkCompleteTasksCommand } from './bulk-complete-tasks.command';
import { TaskCompletedEvent } from '../events/task-completed.event';

@CommandHandler(BulkCompleteTasksCommand)
export class BulkCompleteTasksHandler
  implements ICommandHandler<BulkCompleteTasksCommand>
{
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ taskIds, currentUser }: BulkCompleteTasksCommand) {
    return this.dataSource.transaction(async (manager) => {
      const { raw } = await manager
        .createQueryBuilder()
        .update(Task)
        .set({ status: 'COMPLETED' })
        .whereInIds(taskIds)
        .returning('id')
        .execute();

      raw.forEach((row: { id: string }) =>
        this.eventBus.publish(new TaskCompletedEvent(row.id)),
      );

      return raw.length;
    });
  }
}
