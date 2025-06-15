import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { UpdateTaskCommand } from './update-task.command';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(
    @InjectRepository(Task) private readonly repo: Repository<Task>,
  ) {}

  async execute({ id, dto, currentUser }: UpdateTaskCommand): Promise<Task> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task with ID ${id} not found`);
    if (currentUser.role !== 'admin' && task.userId !== currentUser.id) {
      throw new ForbiddenException('Not authorized to update this task');
    }
    Object.assign(task, dto);
    return this.repo.save(task);
  }
}
