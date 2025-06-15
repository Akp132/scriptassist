import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { TaskStatus } from '../enums/task-status.enum';
import { MarkTaskIncompleteCommand } from './mark-task-incomplete.command';
import { TaskCompletedEvent } from '../events/task-completed.event';

@CommandHandler(MarkTaskIncompleteCommand)
export class MarkTaskIncompleteHandler implements ICommandHandler<MarkTaskIncompleteCommand> {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    private eventBus: EventBus,
  ) {}

  async execute({ id, currentUser }: MarkTaskIncompleteCommand): Promise<Task> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.userId !== currentUser.id && currentUser.role !== 'admin') {
      throw new ForbiddenException('Not allowed');
    }

    task.status = TaskStatus.PENDING;
    const saved = await this.repo.save(task);
    this.eventBus.publish(new TaskCompletedEvent(saved.id));
    return saved;
  }
}
