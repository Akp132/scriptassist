import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { DeleteTaskCommand } from './delete-task.command';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@CommandHandler(DeleteTaskCommand)
export class DeleteTaskHandler implements ICommandHandler<DeleteTaskCommand> {
  constructor(
    @InjectRepository(Task) private readonly repo: Repository<Task>,
  ) {}

  async execute({ id, currentUser }: DeleteTaskCommand): Promise<{ deleted: boolean }> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    if (currentUser.role !== 'admin' && task.userId !== currentUser.id) {
      throw new ForbiddenException('Not authorized to delete this task');
    }
    await this.repo.delete(id);
    return { deleted: true };
  }
}
