import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Task } from '../entities/task.entity';
import { GetTaskByIdQuery } from './get-task-by-id.query';

@QueryHandler(GetTaskByIdQuery)
export class GetTaskByIdHandler implements IQueryHandler<GetTaskByIdQuery> {
  constructor(@InjectRepository(Task) private repo: Repository<Task>) {}

  async execute({ id, currentUser }: GetTaskByIdQuery): Promise<Task> {
    const task = await this.repo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    if (currentUser && currentUser.role !== 'admin' && task.userId !== currentUser.id) {
      throw new ForbiddenException('Not allowed');
    }
    return task;
  }
}
