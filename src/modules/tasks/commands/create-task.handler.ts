import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskCommand } from './create-task.command';
import { TaskCompletedEvent } from '../events/task-completed.event';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    @InjectRepository(Task) private repo: Repository<Task>,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ dto }: CreateTaskCommand): Promise<Task> {
    const task = this.repo.create(dto);
    const saved = await this.repo.save(task);
    if (saved.status === 'COMPLETED') {
      this.eventBus.publish(new TaskCompletedEvent(saved.id));
    }
    return saved;
  }
}
